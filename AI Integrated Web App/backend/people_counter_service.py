import time
import json
import requests
import os
import cv2
from ultralytics import YOLO
import supervision as sv
from flask import Flask, Response
import threading
import numpy as np

# Configuration
NODE_BACKEND_URL = os.getenv('NODE_BACKEND_URL', 'http://localhost:5000')
CONTROL_ENDPOINT = f"{NODE_BACKEND_URL}/api/ai/control"
UPDATE_ENDPOINT = f"{NODE_BACKEND_URL}/api/ai/update"
AUTH_TOKEN = os.getenv('NODE_AI_AUTH_TOKEN', 'SuperSecretAIPostKey123!')

VIDEOS_DIR = os.getenv('VIDEOS_DIR', os.path.join(os.path.dirname(__file__), 'videos'))
YOLO_WEIGHTS = os.getenv('YOLO_WEIGHTS', 'yolov8n.pt')
FLIP_VIDEO = os.getenv('FLIP_VIDEO', 'false').lower() == 'true'

CONTROL_POLL_INTERVAL = 2.0
UPDATE_INTERVAL = int(os.getenv('UPDATE_INTERVAL', '10'))

# ====== FLASK APP FOR VIDEO STREAMING ======
app = Flask(__name__)

# Global variables for multi-building support
building_frames = {}  # {building_id: frame}
frame_locks = {}      # {building_id: threading.Lock()}
building_states = {}  # {building_id: {is_running, direction, counts}}

# Shared YOLO model and tracker
model = None
tracker_pool = {}  # {building_id: tracker}


# ====== MODEL INITIALIZATION ======
def init_model():
    """Initialize YOLO model once (shared across all buildings)"""
    global model
    print("Initializing YOLO model...")
    model = YOLO(YOLO_WEIGHTS)
    print("YOLO model loaded!")


def get_tracker(building_id):
    """Get or create tracker for a building"""
    if building_id not in tracker_pool:
        tracker_pool[building_id] = sv.ByteTrack(
            track_activation_threshold=0.25,
            lost_track_buffer=30,
            minimum_matching_threshold=0.8,
            frame_rate=30
        )
    return tracker_pool[building_id]


# ====== BACKEND COMMUNICATION ======
def poll_control():
    """Poll all buildings' control state"""
    try:
        resp = requests.get(CONTROL_ENDPOINT, timeout=3)
        if resp.status_code == 200:
            data = resp.json()
            return data.get('buildings', {})
    except Exception as e:
        print(f"Control poll failed: {e}")
    return {}


def post_update(building_id, direction, enter_count, leave_count):
    """Post count update to backend"""
    payload = {
        "building_id": building_id,
        "direction": direction,
        "enter_count": enter_count,
        "leave_count": leave_count
    }
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    try:
        r = requests.post(UPDATE_ENDPOINT, json=payload, headers=headers, timeout=10)
        print(f"[{building_id}] Posted: Enter={enter_count}, Exit={leave_count}")
        return r.status_code in (200, 204)
    except Exception as e:
        print(f"[{building_id}] Post failed: {e}")
        return False


# ====== VIDEO STREAMING ======
def generate_frames(building_id):
    """Generator for Flask video streaming per building"""
    while True:
        if building_id not in frame_locks:
            frame_locks[building_id] = threading.Lock()

        with frame_locks[building_id]:
            if building_id not in building_frames or building_frames[building_id] is None:
                blank = cv2.imencode('.jpg', np.zeros((480, 640, 3), dtype='uint8'))[1].tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + blank + b'\r\n')
                time.sleep(0.1)
                continue

            frame_copy = building_frames[building_id].copy()

        # Resize and encode
        height, width = frame_copy.shape[:2]
        if width > 1280:
            scale = 1280 / width
            frame_copy = cv2.resize(frame_copy, None, fx=scale, fy=scale)

        ret, buffer = cv2.imencode('.jpg', frame_copy, [cv2.IMWRITE_JPEG_QUALITY, 50])
        if not ret:
            continue

        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        time.sleep(0.016)  # ~60 FPS


@app.route('/video_feed/<building_id>')
def video_feed(building_id):
    """Video streaming route per building"""
    return Response(generate_frames(building_id),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/health')
def health():
    """Health check"""
    return {'status': 'ok', 'active_buildings': len([b for b, s in building_states.items() if s.get('is_running')])}


# ====== MAIN PROCESSING LOOP ======
def process_building(building_id, config):
    global model, building_frames, frame_locks, building_states
    
    print(f"[{building_id}] Starting detection")
    
    # Initialize frame lock
    if building_id not in frame_locks:
        frame_locks[building_id] = threading.Lock()
    
    # Get video path
    video_path = os.path.join(VIDEOS_DIR, config.get('video_path', ''))
    if not os.path.exists(video_path):
        print(f" [{building_id}] Video not found: {video_path}")
        return
    
    # Open video
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f" [{building_id}] Failed to open video")
        return
    
    # Get video FPS for proper playback speed
    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_delay = 1.0 / video_fps
    
    print(f"[{building_id}] Video loaded: {config.get('video_path')} @ {video_fps} FPS")
    
    # Get tracker
    tracker = get_tracker(building_id)
    
    # Detection variables
    enter_count = 0
    leave_count = 0
    previous_positions = {}
    previous_states = {}
    id_mapping = {}
    next_seq_id = 1
    last_update_time = time.time()
    
    # Get ROI
    roi = config.get('roi', {})
    direction = config.get('direction')
    
    while True:
        # Check if still running
        controls = poll_control()
        current_config = controls.get(building_id, {})
        
        if not current_config.get('is_running'):
            print(f" [{building_id}] Stopped")
            # Final update
            if enter_count > 0 or leave_count > 0:
                if enter_count > 0:
                    post_update(building_id, 'IN', enter_count, 0)
                if leave_count > 0:
                    post_update(building_id, 'OUT', 0, leave_count)
            # Clear frame
            with frame_locks[building_id]:
                building_frames[building_id] = None
            cap.release()
            break
        
        # Read frame
        ret, frame = cap.read()
        if not ret:
            # Loop video
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
            if not ret:
                print(f"[{building_id}] Video ended")
                time.sleep(0.1)
                continue
        
        if FLIP_VIDEO:
            frame = cv2.flip(frame, 1)
        
        frame_height, frame_width = frame.shape[:2]
        
        # Get ROI coordinates
        if roi and all(k in roi for k in ('x1', 'y1', 'x2', 'y2')):
            x1, y1, x2, y2 = roi['x1'], roi['y1'], roi['x2'], roi['y2']
        else:
            x1 = int(frame_width * 0.3)
            y1 = int(frame_height * 0.2)
            x2 = int(frame_width * 0.7)
            y2 = int(frame_height * 0.8)
        
        # Run detection
        try:
            results = model(frame, classes=[0], conf=0.5, iou=0.7, verbose=False)
            detections = sv.Detections.from_ultralytics(results[0])
            tracked = tracker.update_with_detections(detections)
        except Exception as e:
            print(f"[{building_id}] Detection error: {e}")
            continue
        
        # Draw ROI
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, f"{building_id} - DOOR AREA", (x1 + 5, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        # Center line
        roi_center_y = (y1 + y2) // 2
        cv2.line(frame, (x1, roi_center_y), (x2, roi_center_y), (0, 255, 255), 2)
        
        # Process tracked objects
        if tracked.tracker_id is not None:
            for i in range(len(tracked)):
                x1b, y1b, x2b, y2b = tracked.xyxy[i]
                orig_tid = int(tracked.tracker_id[i])
                cx = int((x1b + x2b) / 2)
                cy = int((y1b + y2b) / 2)
                is_inside = (x1 < cx < x2 and y1 < cy < y2)
                
                # Draw bounding box
                color = (0, 255, 0) if is_inside else (255, 0, 0)
                cv2.rectangle(frame, (int(x1b), int(y1b)), (int(x2b), int(y2b)), color, 2)
                
                if orig_tid in id_mapping:
                    track_id = id_mapping[orig_tid]
                    cv2.putText(frame, f"ID: {track_id}", (int(x1b), int(y1b) - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
                was_inside = previous_states.get(orig_tid, False)
                if orig_tid in previous_positions:
                    prev_cx, prev_cy = previous_positions[orig_tid]
                    
                    # Entry detection
                    if not was_inside and is_inside:
                        if orig_tid not in id_mapping:
                            id_mapping[orig_tid] = next_seq_id
                            next_seq_id += 1
                    
                    # Crossing detection
                    if is_inside and orig_tid in id_mapping:
                        track_id = id_mapping[orig_tid]
                        
                        # Top to bottom crossing (ENTER)
                        if prev_cy < roi_center_y and cy >= roi_center_y:
                            enter_count += 1
                            print(f"[{building_id}] ENTER counted (ID: {track_id})")
                        
                        # Bottom to top crossing (EXIT)
                        elif prev_cy > roi_center_y and cy <= roi_center_y:
                            leave_count += 1
                            print(f"[{building_id}] EXIT counted (ID: {track_id})")
                
                previous_positions[orig_tid] = (cx, cy)
                previous_states[orig_tid] = is_inside
        
        # Update shared frame
        with frame_locks[building_id]:
            building_frames[building_id] = frame.copy()
        
        # Sleep based on video FPS to maintain original speed
        time.sleep(frame_delay)
        
        # Time-based update to backend
        now = time.time()
        if now - last_update_time >= UPDATE_INTERVAL:
            if enter_count > 0 or leave_count > 0:
                # Post enter count as IN
                if enter_count > 0:
                    post_update(building_id, 'IN', enter_count, 0)
                    print(f"[{building_id}] Sent ENTER: {enter_count}")
                
                # Post leave count as OUT
                if leave_count > 0:
                    post_update(building_id, 'OUT', 0, leave_count)
                    print(f"[{building_id}] Sent EXIT: {leave_count}")
                
                # Reset counters
                enter_count = 0
                leave_count = 0
            last_update_time = now


# ====== CONTROL LOOP ======
def main_loop():
    """Main control loop - manages all buildings"""
    global model

    init_model()

    active_threads = {}
    last_controls = {}

    while True:
        controls = poll_control()

        for building_id, config in controls.items():
            is_running = config.get('is_running', False)

            if is_running and building_id not in active_threads:
                thread = threading.Thread(
                    target=process_building,
                    args=(building_id, config),
                    daemon=True
                )
                thread.start()
                active_threads[building_id] = thread
                building_states[building_id] = config
                print(f"[{building_id}] Started thread")

            elif not is_running and building_id in active_threads:
                if not active_threads[building_id].is_alive():
                    del active_threads[building_id]
                    if building_id in building_states:
                        del building_states[building_id]
                    print(f"🗑️  [{building_id}] Thread cleaned up")

        dead_threads = [bid for bid, thread in active_threads.items() if not thread.is_alive()]
        for bid in dead_threads:
            del active_threads[bid]
            if bid in building_states:
                del building_states[bid]

        last_controls = controls
        time.sleep(CONTROL_POLL_INTERVAL)


# ====== ENTRY POINT ======
if __name__ == '__main__':
    print("=" * 60)
    print("Multi-Building AI People Counter Service Starting...")
    print("=" * 60)
    print(f"Node Backend: {NODE_BACKEND_URL}")
    print(f"Videos Directory: {VIDEOS_DIR}")
    print(f"YOLO Weights: {YOLO_WEIGHTS}")
    print("=" * 60)

    control_thread = threading.Thread(target=main_loop, daemon=True)
    control_thread.start()
    print("Control loop started")

    print("Starting Flask video server on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
