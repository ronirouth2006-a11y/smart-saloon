import cv2
import requests
from ultralytics import YOLO
from config import settings

# Load YOLO model
model = YOLO("yolov8n.pt")

# Backend API
API_URL = "http://127.0.0.1:8000/camera/update-count"

# This saloon must exist in DB
SALOON_ID = 1

def send_count_to_backend(count):
    payload = {
        "saloon_id": SALOON_ID,
        "people": count
    }
    
    # 🔐 Injecting the required security authorization header
    headers = {
        "x-api-key": settings.CAMERA_API_KEY
    }

    try:
        res = requests.post(API_URL, json=payload, headers=headers, timeout=2)
        print("Sent:", payload, "Status:", res.status_code)
    except Exception as e:
        print("Backend error:", e)


def run_camera():
    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        results = model(frame)
        count = 0

        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                if model.names[cls] == "person":
                    count += 1

        # Send to backend
        send_count_to_backend(count)

        cv2.putText(frame, f"People: {count}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.imshow("Salon Camera", frame)

        if cv2.waitKey(1) == 27:
            break

    cap.release()
    cv2.destroyAllWindows()





