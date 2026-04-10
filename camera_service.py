import cv2
import requests
from ultralytics import YOLO
from config import settings

# Load YOLO model
model = YOLO("yolov8n.pt")

# Backend API
API_URL = "https://smart-saloon-qmdh.onrender.com/camera/update-count"

def send_count_to_backend(saloon_id, count):
    payload = {
        "saloon_id": saloon_id,
        "people": count
    }
    
    headers = {
        "x-api-key": settings.CAMERA_API_KEY
    }

    try:
        res = requests.post(API_URL, json=payload, headers=headers, timeout=2)
        print(f"Salon [{saloon_id}] - Sent Count: {count} - Status: {res.status_code}")
    except Exception as e:
        print(f"Backend error for Salon [{saloon_id}]:", e)

import time
from collections import deque

def run_camera(saloon_id, source=0):
    """
    Runs the YOLO-based people counting on a video source.
    - saloon_id: The ID from the DB
    - source: 0 for webcam or an RTSP URL for CCTV
    """
    print(f"📡 Starting camera service for Salon ID: {saloon_id} | Source: {source}")
    
    # 📈 Smoothing Logic: Keep track of the last 10 counts to calculate a stable average
    # This prevents the UI from flickering (e.g. 5-6-5-5-55-5)
    history = deque(maxlen=10)
    last_sent_count = -1

    while True:
        cap = cv2.VideoCapture(source)
        
        if not cap.isOpened():
            print(f"❌ Could not open video source {source}. Retrying in 5s...")
            time.sleep(5)
            continue

        while True:
            ret, frame = cap.read()
            if not ret:
                print(f"⚠️ Salon [{saloon_id}]: Stream disconnected. Reconnecting...")
                break

            results = model(frame)
            current_raw_count = 0

            for r in results:
                for box in r.boxes:
                    cls = int(box.cls[0])
                    if model.names[cls] == "person":
                        current_raw_count += 1

            # --- Count Smoothing Algorithm ---
            history.append(current_raw_count)
            # Calculate the most frequent count in history (mode) or average
            # Mode is better for avoiding "jumping" counts
            stable_count = max(set(history), key=history.count)

            # Only send if the stable count has changed to avoid unnecessary API calls
            if stable_count != last_sent_count:
                send_count_to_backend(saloon_id, stable_count)
                last_sent_count = stable_count

            # Optional: Visual Debugging
            try:
                cv2.putText(frame, f"Salon ID: {saloon_id} | People: {stable_count}", (20, 40),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.imshow(f"Camera - Salon {saloon_id}", frame)
                if cv2.waitKey(1) == 27:
                    cap.release()
                    cv2.destroyAllWindows()
                    return
            except Exception:
                pass

        cap.release()
        time.sleep(2)





