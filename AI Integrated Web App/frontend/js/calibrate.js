/* ==========================================================
   Multi-Building Calibration with Video Upload
   ========================================================== */

const video = document.getElementById("calibrationVideo");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

const buildingSelect = document.getElementById("buildingSelect");
const videoUpload = document.getElementById("videoUpload");
const uploadStatus = document.getElementById("uploadStatus");
const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const videoPlaceholder = document.getElementById("videoPlaceholder");

const infoBuildingId = document.getElementById("infoBuildingId");
const infoBuildingName = document.getElementById("infoBuildingName");
const infoVideoName = document.getElementById("infoVideoName");
const infoCalibrationStatus = document.getElementById("infoCalibrationStatus");

let currentBuilding = null;
let uploadedVideoFile = null;
let uploadedVideoPath = null;

// =======================
// 📋 Load Buildings from Supabase
// =======================
async function loadBuildings() {
  try {
    const response = await fetch('/api/buildings');
    const buildings = await response.json();
    
    buildingSelect.innerHTML = '<option value="">-- Select Building --</option>';
    
    buildings.forEach(building => {
      const option = document.createElement('option');
      option.value = building.building_id;
      option.textContent = `${building.building_id} - ${building.Build_Name}`;
      option.dataset.buildingName = building.Build_Name;
      buildingSelect.appendChild(option);
    });
    
    console.log('✅ Loaded buildings:', buildings.length);
  } catch (error) {
    console.error('❌ Failed to load buildings:', error);
    showStatus('Failed to load buildings from database', 'error');
  }
}

// =======================
// 🏢 Building Selection Handler
// =======================
buildingSelect.addEventListener('change', async (e) => {
  const buildingId = e.target.value;
  
  if (!buildingId) {
    currentBuilding = null;
    updateBuildingInfo(null);
    return;
  }
  
  const selectedOption = e.target.selectedOptions[0];
  currentBuilding = {
    building_id: buildingId,
    building_name: selectedOption.dataset.buildingName
  };
  
  // Load existing calibration if available
  await loadExistingCalibration(buildingId);
  updateBuildingInfo(currentBuilding);
});

// =======================
// 📥 Load Existing Calibration
// =======================
async function loadExistingCalibration(buildingId) {
  try {
    const response = await fetch(`/api/ai/calibration/${buildingId}`);
    if (response.ok) {
      const data = await response.json();
      if (data.roi) {
        currentBuilding.roi = data.roi;
        currentBuilding.video_path = data.video_path;
        infoCalibrationStatus.textContent = '✅ Calibrated';
        infoCalibrationStatus.style.color = '#28a745';
        
        if (data.video_path) {
          infoVideoName.textContent = data.video_path.split('/').pop();
        }
      }
    }
  } catch (error) {
    console.log('No existing calibration found');
  }
}

// =======================
// 📤 Video Upload Handler
// =======================
videoUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validate file size (100MB = 104857600 bytes)
  if (file.size > 104857600) {
    showStatus('❌ File too large! Max 100MB allowed', 'error');
    videoUpload.value = '';
    return;
  }
  
  // Validate file type
  const validTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo'];
  if (!validTypes.includes(file.type)) {
    showStatus('❌ Invalid file type! Use MP4, AVI, or MOV', 'error');
    videoUpload.value = '';
    return;
  }
  
  if (!currentBuilding) {
    showStatus('⚠️ Please select a building first!', 'error');
    videoUpload.value = '';
    return;
  }
  
  uploadedVideoFile = file;
  showStatus(`✅ Video selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`, 'success');
  infoVideoName.textContent = file.name;
  
  // Upload video to server
  await uploadVideoFile(file);
});

// =======================
// 📤 Upload Video to Server
// =======================
async function uploadVideoFile(file) {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('building_id', currentBuilding.building_id);
  
  showStatus('⏳ Uploading video...', 'info');
  
  try {
    const response = await fetch('/api/ai/upload-video', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      uploadedVideoPath = data.video_path;
      showStatus(`✅ Video uploaded successfully!`, 'success');
      console.log('Video uploaded:', data.video_path);
    } else {
      showStatus('❌ Upload failed: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Upload error:', error);
    showStatus('❌ Upload failed: ' + error.message, 'error');
  }
}

// =======================
// 🎬 Load Video for Calibration
// =======================
loadBtn.addEventListener('click', () => {
  if (!currentBuilding) {
    showStatus('⚠️ Please select a building first!', 'error');
    return;
  }
  
  if (!uploadedVideoPath) {
    showStatus('⚠️ Please upload a video first!', 'error');
    return;
  }
  
  // Load video for calibration
  video.src = `/videos/${uploadedVideoPath}`;
  video.load();
  
  video.onloadedmetadata = () => {
    videoPlaceholder.style.display = 'none';
    video.style.display = 'block';
    video.classList.add('active');
    canvas.classList.add('active');
    resizeCanvasToVideo();
    
    // Seek to 1 second to get a good frame
    video.currentTime = 1;
    showStatus('✅ Video loaded! Draw rectangle around door area', 'success');
  };
  
  video.onerror = () => {
    showStatus('❌ Failed to load video', 'error');
  };
});

// =======================
// 🖼️ Canvas Syncing
// =======================
function resizeCanvasToVideo() {
  if (!video.videoWidth) return;
  
  const displayW = video.clientWidth;
  const displayH = video.clientHeight;
  
  canvas.style.width = displayW + "px";
  canvas.style.height = displayH + "px";
  
  const dpr = window.devicePixelRatio || 1;
  canvas.width = displayW * dpr;
  canvas.height = displayH * dpr;
  
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
  if (sx !== ex && sy !== ey) {
    draw();
  }
}

window.addEventListener("resize", resizeCanvasToVideo);
video.addEventListener("loadedmetadata", resizeCanvasToVideo);

// =======================
// ✏️ Rectangle Drawing
// =======================
let drawing = false;
let sx = 0, sy = 0, ex = 0, ey = 0;

function getRelativePos(evt) {
  const rect = canvas.getBoundingClientRect();
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  
  return {
    x: Math.max(0, Math.min(rect.width, clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, clientY - rect.top))
  };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (sx === ex && sy === ey) return;
  
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#00ff00";
  ctx.fillStyle = "rgba(0,255,0,0.2)";
  
  const w = ex - sx;
  const h = ey - sy;
  
  ctx.fillRect(sx, sy, w, h);
  ctx.strokeRect(sx, sy, w, h);
  
  ctx.fillStyle = "#00ff00";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Door Area", sx + 8, sy - 8);
}

function onPointerDown(e) {
  e.preventDefault();
  const pos = getRelativePos(e);
  drawing = true;
  sx = pos.x;
  sy = pos.y;
  ex = sx;
  ey = sy;
  draw();
}

function onPointerMove(e) {
  if (!drawing) return;
  e.preventDefault();
  const pos = getRelativePos(e);
  ex = pos.x;
  ey = pos.y;
  draw();
}

function onPointerUp(e) {
  if (!drawing) return;
  e.preventDefault();
  drawing = false;
  draw();
  
  const width = Math.abs(ex - sx);
  const height = Math.abs(ey - sy);
  
  if (width > 10 && height > 10) {
    showStatus('✅ Rectangle drawn! Click "Save Door Area" to save', 'success');
  }
}

canvas.addEventListener("mousedown", onPointerDown);
canvas.addEventListener("mousemove", onPointerMove);
canvas.addEventListener("mouseup", onPointerUp);
canvas.addEventListener("touchstart", onPointerDown, { passive: false });
canvas.addEventListener("touchmove", onPointerMove, { passive: false });
canvas.addEventListener("touchend", onPointerUp, { passive: false });

// =======================
// 💾 Save Calibration
// =======================
saveBtn.addEventListener('click', async () => {
  if (!currentBuilding) {
    showStatus('⚠️ Please select a building first!', 'error');
    return;
  }
  
  if (!uploadedVideoPath) {
    showStatus('⚠️ Please upload a video first!', 'error');
    return;
  }
  
  if (sx === ex || sy === ey) {
    showStatus('⚠️ Please draw a rectangle first!', 'error');
    return;
  }
  
  // Scale to natural video resolution
  const displayW = video.clientWidth;
  const displayH = video.clientHeight;
  const naturalW = video.videoWidth || displayW;
  const naturalH = video.videoHeight || displayH;
  const scaleX = naturalW / displayW;
  const scaleY = naturalH / displayH;
  
  const roi = {
    x1: Math.round(Math.min(sx, ex) * scaleX),
    y1: Math.round(Math.min(sy, ey) * scaleY),
    x2: Math.round(Math.max(sx, ex) * scaleX),
    y2: Math.round(Math.max(sy, ey) * scaleY)
  };
  
  const payload = {
    building_id: currentBuilding.building_id,
    roi: roi,
    video_path: uploadedVideoPath,
    video_width: naturalW,
    video_height: naturalH
  };
  
  showStatus('⏳ Saving calibration...', 'info');
  
  try {
    const response = await fetch('/api/ai/save-calibration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showStatus(`✅ Calibration saved for ${currentBuilding.building_id}!`, 'success');
      infoCalibrationStatus.textContent = '✅ Calibrated';
      infoCalibrationStatus.style.color = '#28a745';
      console.log('Calibration saved:', data);
    } else {
      showStatus('❌ Error: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Save error:', error);
    showStatus('❌ Failed to save calibration', 'error');
  }
});

// =======================
// 🧹 Clear (Improved)
// =======================
clearBtn.addEventListener('click', () => {
  // Optional confirmation
  if (!confirm('Are you sure you want to clear all calibration data and selections?')) return;

  // 1️⃣ Clear canvas drawing
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  sx = sy = ex = ey = 0;

  // 2️⃣ Reset building selection and state
  buildingSelect.value = "";
  currentBuilding = null;
  uploadedVideoFile = null;
  uploadedVideoPath = null;

  // 3️⃣ Reset info panel
  infoBuildingId.textContent = '—';
  infoBuildingName.textContent = '—';
  infoVideoName.textContent = 'Not uploaded';
  infoCalibrationStatus.textContent = 'Not calibrated';
  infoCalibrationStatus.style.color = '#dc3545';

  // 4️⃣ Clear upload status
  uploadStatus.textContent = '';
  uploadStatus.className = 'upload-status';

  // 5️⃣ Reset video and show placeholder again
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.classList.remove('active');
  canvas.classList.remove('active');
  videoPlaceholder.style.display = 'flex';
  video.style.display = 'none';

  // 6️⃣ Final confirmation message
  showStatus('🧹 All fields and video cleared!', 'info');
});

// =======================
// 📊 Status Messages
// =======================
function showStatus(message, type = 'info') {
  uploadStatus.textContent = message;
  uploadStatus.className = `upload-status ${type}`;
  
  setTimeout(() => {
    uploadStatus.className = 'upload-status';
  }, 5000);
}

// =======================
// 📋 Update Building Info Panel
// =======================
function updateBuildingInfo(building) {
  if (!building) {
    infoBuildingId.textContent = '—';
    infoBuildingName.textContent = '—';
    infoVideoName.textContent = 'Not uploaded';
    infoCalibrationStatus.textContent = 'Not calibrated';
    infoCalibrationStatus.style.color = '#dc3545';
    return;
  }
  
  infoBuildingId.textContent = building.building_id;
  infoBuildingName.textContent = building.building_name;
}

// =======================
// 🎯 Initialize
// =======================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 Multi-Building Calibration System Initialized');
  loadBuildings();
});
