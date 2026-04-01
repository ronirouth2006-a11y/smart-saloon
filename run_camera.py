import sys
from camera_service import run_camera

if __name__ == "__main__":
    # Usage: python run_camera.py [saloon_id] [rtsp_url_or_index]
    saloon_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    source = sys.argv[2] if len(sys.argv) > 2 else 0
    
    # Try to convert to int if it's a digit (for local webcam index)
    if isinstance(source, str) and source.isdigit():
        source = int(source)
        
    run_camera(saloon_id, source)
