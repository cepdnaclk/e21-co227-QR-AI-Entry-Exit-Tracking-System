// app.js - Multi-Building AI People Counter Frontend
const CONTROL_URL = '/api/ai/control';
const VIDEO_FEED_URL = 'http://localhost:5001/video_feed'; // Flask video stream
const BUILDINGS_URL = '/api/buildings';

const buildingSelect = document.getElementById('buildingSelect');
const directionSelect = document.getElementById('directionSelect');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const currentBuildingName = document.getElementById('currentBuildingName');
const statusDirection = document.getElementById('statusDirection');
const statusRunning = document.getElementById('statusRunning');
const currentOccupancy = document.getElementById('currentOccupancy');
const enterCount = document.getElementById('enterCount');
const exitCount = document.getElementById('exitCount');
const videoFeed = document.getElementById('videoFeed');
const noFeedMessage = document.getElementById('noFeedMessage');

let isRunning = false;
let statsInterval = null;
let occupancyInterval = null;
let selectedBuilding = null;

// ========================================
// 🏢 LOAD BUILDINGS FROM SUPABASE
// ========================================
async function loadBuildings() {
  try {
    const response = await fetch(BUILDINGS_URL);
    const buildings = await response.json();
    
    buildingSelect.innerHTML = '<option value="">-- Select Building --</option>';
    
    buildings.forEach(building => {
      const option = document.createElement('option');
      option.value = building.building_id;
      option.textContent = `${building.building_id} - ${building.Build_Name}`;
      option.dataset.buildingName = building.Build_Name;
      option.dataset.occupancy = building.total_count || 0;
      buildingSelect.appendChild(option);
    });
    
    console.log('✅ Loaded buildings:', buildings.length);
  } catch (error) {
    console.error('❌ Failed to load buildings:', error);
    alert('Failed to load buildings from database');
  }
}

// ========================================
// 🏢 BUILDING SELECTION HANDLER
// ========================================
buildingSelect.addEventListener('change', (e) => {
  const buildingId = e.target.value;
  
  if (!buildingId) {
    selectedBuilding = null;
    currentBuildingName.textContent = 'No Building Selected';
    currentOccupancy.textContent = '—';
    stopOccupancyPolling();
    return;
  }
  
  const selectedOption = e.target.selectedOptions[0];
  selectedBuilding = {
    building_id: buildingId,
    building_name: selectedOption.dataset.buildingName,
    occupancy: parseInt(selectedOption.dataset.occupancy) || 0
  };
  
  currentBuildingName.textContent = selectedBuilding.building_name;
  currentOccupancy.textContent = selectedBuilding.occupancy;
  
  // Start polling occupancy for selected building
  startOccupancyPolling();
  
  console.log('Selected building:', selectedBuilding);
});

// ========================================
// START COUNTING
// ========================================
startBtn.onclick = async () => {
  if (!selectedBuilding) {
    alert('⚠️ Please select a building first');
    return;
  }
  
  const direction = directionSelect.value;

  try {
    const response = await fetch(CONTROL_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        building_id: selectedBuilding.building_id,
        direction: direction,
        is_running: true,
        from: 'frontend'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Started counting:', data);
      updateStatus(true, direction);
      startStatsPolling();
      showVideoFeed();
    } else {
      alert('❌ Failed to start counting: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error starting:', error);
    alert('❌ Failed to connect to server');
  }
};

// ========================================
// STOP COUNTING
// ========================================
stopBtn.onclick = async () => {
  if (!selectedBuilding) {
    alert('⚠️ Please select a building first');
    return;
  }

  try {
    const response = await fetch(CONTROL_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        building_id: selectedBuilding.building_id,
        is_running: false,
        from: 'frontend'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('🛑 Stopped counting');
      updateStatus(false, null);
      stopStatsPolling();
      hideVideoFeed();
      resetSessionCounts();
    }
  } catch (error) {
    console.error('Error stopping:', error);
  }
};

// ========================================
// UPDATE STATUS DISPLAY
// ========================================
function updateStatus(running, direction) {
  statusDirection.textContent = direction || '—';
  
  if (running) {
    statusRunning.textContent = 'Running';
    statusRunning.className = 'status-badge on';
    isRunning = true;
  } else {
    statusRunning.textContent = 'Stopped';
    statusRunning.className = 'status-badge off';
    isRunning = false;
  }
}

// ========================================
// POLL SESSION COUNTS (ENTERED/EXITED)
// ========================================
async function fetchSessionCounts() {
  if (!selectedBuilding) return;
  
  try {
    const response = await fetch(`${CONTROL_URL}/${selectedBuilding.building_id}`);
    const data = await response.json();
    
    if (data && data.current_counts) {
      enterCount.textContent = data.current_counts.enter || 0;
      exitCount.textContent = data.current_counts.exit || 0;
      
      console.log(`📊 Session counts - Enter: ${data.current_counts.enter}, Exit: ${data.current_counts.exit}`);
    }
  } catch (error) {
    console.error('Failed to fetch session counts:', error);
  }
}

// ========================================
// POLL CURRENT OCCUPANCY FROM SUPABASE
// ========================================
async function fetchCurrentOccupancy() {
  if (!selectedBuilding) return;
  
  try {
    const response = await fetch(`${BUILDINGS_URL}/${selectedBuilding.building_id}`);
    const building = await response.json();
    
    if (building && building.total_count !== undefined) {
      currentOccupancy.textContent = building.total_count;
      console.log(`👥 Current occupancy: ${building.total_count}`);
    }
  } catch (error) {
    console.error('Failed to fetch occupancy:', error);
  }
}

// ========================================
// STATS POLLING
// ========================================
function startStatsPolling() {
  if (statsInterval) return;
  
  // Poll session counts every 2 seconds
  statsInterval = setInterval(fetchSessionCounts, 2000);
  fetchSessionCounts(); // Immediate fetch
  console.log('📊 Started session stats polling');
}

function stopStatsPolling() {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
    console.log('🛑 Stopped session stats polling');
  }
}

function startOccupancyPolling() {
  stopOccupancyPolling(); // Clear existing
  
  // Poll occupancy every 3 seconds
  occupancyInterval = setInterval(fetchCurrentOccupancy, 3000);
  fetchCurrentOccupancy(); // Immediate fetch
  console.log('👥 Started occupancy polling');
}

function stopOccupancyPolling() {
  if (occupancyInterval) {
    clearInterval(occupancyInterval);
    occupancyInterval = null;
  }
}

function resetSessionCounts() {
  enterCount.textContent = '0';
  exitCount.textContent = '0';
}

// ========================================
// VIDEO FEED CONTROLS
// ========================================
function showVideoFeed() {
  if (!selectedBuilding) return;
  
  videoFeed.src = `${VIDEO_FEED_URL}/${selectedBuilding.building_id}?t=` + Date.now();
  videoFeed.style.display = 'block';
  noFeedMessage.style.display = 'none';
  console.log('📹 Video feed started for', selectedBuilding.building_id);
}

function hideVideoFeed() {
  videoFeed.src = '';
  videoFeed.style.display = 'none';
  noFeedMessage.style.display = 'flex';
  console.log('📹 Video feed stopped');
}

// ========================================
// PERIODIC CONTROL STATE CHECK
// ========================================
async function checkControlState() {
  if (!selectedBuilding) return;
  
  try {
    const res = await fetch(`${CONTROL_URL}/${selectedBuilding.building_id}`);
    const control = await res.json();
    
    if (control) {
      const running = control.is_running;
      updateStatus(running, control.direction);
      
      // Sync video feed with control state
      if (running && !isRunning) {
        showVideoFeed();
        startStatsPolling();
      } else if (!running && isRunning) {
        hideVideoFeed();
        stopStatsPolling();
        resetSessionCounts();
      }
    }
  } catch (error) {
    console.error('Control state check failed:', error);
  }
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 AI People Counter Dashboard Initialized');
  
  // Load buildings from Supabase
  await loadBuildings();
  
  // Check control state every 5 seconds
  setInterval(() => {
    if (selectedBuilding) {
      checkControlState();
    }
  }, 5000);
  
  // Hide video feed initially
  hideVideoFeed();
});

// ========================================
// VIDEO FEED ERROR HANDLING
// ========================================
videoFeed.onerror = () => {
  console.warn('⚠️ Video feed connection lost');
  if (isRunning) {
    // Try to reconnect
    setTimeout(() => {
      if (isRunning && selectedBuilding) {
        videoFeed.src = `${VIDEO_FEED_URL}/${selectedBuilding.building_id}?t=` + Date.now();
      }
    }, 2000);
  }
};

videoFeed.onload = () => {
  console.log('✅ Video feed connected');
};