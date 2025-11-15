// backend/controllers/aiController.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const multer = require('multer');

const CONTROL_FILE = path.join(__dirname, '..', 'ai_control.json');
const VIDEOS_DIR = path.join(__dirname, '..', 'videos');

// Ensure videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// Ensure control file exists with multi-building structure
if (!fs.existsSync(CONTROL_FILE)) {
  fs.writeFileSync(CONTROL_FILE, JSON.stringify({ buildings: {} }, null, 2));
}

function readControl() {
  try {
    const raw = fs.readFileSync(CONTROL_FILE);
    const data = JSON.parse(raw);
    // Migrate old format to new format if needed
    if (!data.buildings) {
      return { buildings: {} };
    }
    return data;
  } catch (err) {
    return { buildings: {} };
  }
}

function writeControl(obj) {
  fs.writeFileSync(CONTROL_FILE, JSON.stringify(obj, null, 2));
}

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEOS_DIR);
  },
  filename: (req, file, cb) => {
    const buildingId = req.body.building_id;
    const ext = path.extname(file.originalname);
    cb(null, `${buildingId}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, AVI, MOV allowed.'));
    }
  }
}).single('video');

// Upload video handler
exports.uploadVideo = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const videoPath = req.file.filename;
    res.json({ success: true, video_path: videoPath });
  });
};

// Save calibration for a building
exports.saveCalibration = (req, res) => {
  const { building_id, roi, video_path, video_width, video_height } = req.body;
  
  if (!building_id || !roi) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  
  const control = readControl();
  
  if (!control.buildings[building_id]) {
    control.buildings[building_id] = {};
  }
  
  control.buildings[building_id] = {
    building_id,
    roi,
    video_path,
    video_width,
    video_height,
    is_running: false,
    direction: null,
    current_counts: { enter: 0, exit: 0 }
  };
  
  writeControl(control);
  res.json({ success: true, building_id });
};

// Get calibration for a building
exports.getCalibration = (req, res) => {
  const { building_id } = req.params;
  const control = readControl();
  
  if (control.buildings[building_id]) {
    res.json(control.buildings[building_id]);
  } else {
    res.status(404).json({ error: 'Building not found' });
  }
};

// Set control for a specific building
exports.setControl = (req, res) => {
  const { building_id, is_running, direction } = req.body;
  
  if (!building_id) {
    return res.status(400).json({ success: false, error: 'building_id required' });
  }
  
  const control = readControl();
  
  if (!control.buildings[building_id]) {
    control.buildings[building_id] = {
      building_id,
      is_running: false,
      direction: null,
      roi: null,
      video_path: null,
      current_counts: { enter: 0, exit: 0 }
    };
  }
  
  if (typeof is_running === 'boolean') {
    control.buildings[building_id].is_running = is_running;
  }
  if (direction !== undefined) {
    control.buildings[building_id].direction = direction;
  }
  
  writeControl(control);
  res.json({ success: true, building: control.buildings[building_id] });
};

// Get control state for a specific building
exports.getControl = (req, res) => {
  const { building_id } = req.params;
  const control = readControl();
  
  if (building_id && control.buildings[building_id]) {
    res.json(control.buildings[building_id]);
  } else if (!building_id) {
    // Return all buildings
    res.json(control);
  } else {
    res.status(404).json({ error: 'Building not found' });
  }
};

// Update counts from Python service
exports.updateCount = async (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');
  
  const requiredToken = process.env.NODE_AI_AUTH_TOKEN;
  if (requiredToken && token !== requiredToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { building_id, direction, enter_count, leave_count } = req.body;
  
  if (!building_id || !direction) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  
  // Update in-memory counts
  const control = readControl();
  if (control.buildings[building_id]) {
    control.buildings[building_id].current_counts = {
      enter: enter_count || 0,
      exit: leave_count || 0
    };
    writeControl(control);
  }
  
  // Call Supabase RPC
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.warn('Supabase not configured');
      return res.json({ success: true, note: 'Local only' });
    }
    
    const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/update_building_count`;
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // Call RPC based on direction
    if (direction === 'IN' && enter_count > 0) {
      await axios.post(rpcUrl, {
        p_building_id: building_id,
        p_direction: 'IN',
        p_count: enter_count
      }, { headers, timeout: 10000 });
    }
    
    if (direction === 'OUT' && leave_count > 0) {
      await axios.post(rpcUrl, {
        p_building_id: building_id,
        p_direction: 'OUT',
        p_count: leave_count
      }, { headers, timeout: 10000 });
    }
    
    return res.json({ success: true });
  } catch (err) {
    console.error('Supabase RPC error:', err.message);
    return res.status(500).json({ error: 'Failed to update Supabase' });
  }
};