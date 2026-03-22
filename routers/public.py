from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import math

# Router with prefix so the URL becomes: http://127.0.0.1:8000/public/salons/nearby
router = APIRouter(prefix="/public", tags=["Public"])

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 🌍 Haversine distance formula (Calculates distance between two GPS points in km)
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# 🚀 MAIN API: Finds nearby salons based on User's current location (Kolaghat or Kolkata)
@router.get("/salons/nearby")
def get_nearby(user_lat: float, user_lon: float, db: Session = Depends(get_db)):
    import pytz
    
    # 1. Fetch only active shops from the database
    salons = db.query(models.Saloon).filter(models.Saloon.is_active == True).all()

    result = []
    ist_timezone = pytz.timezone('Asia/Kolkata')

    for s in salons:
        if s.latitude and s.longitude:
            # 2. Calculate accurate distance from user to this specific saloon
            
            # Using Haversine formula
            R = 6371.0 # Earth radius in kilometers
            lat1 = math.radians(user_lat)
            lon1 = math.radians(user_lon)
            lat2 = math.radians(s.latitude)
            lon2 = math.radians(s.longitude)

            dlon = lon2 - lon1
            dlat = lat2 - lat1

            a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            distance = R * c

            # 3. Get Live Crowd Count from LiveStatus table
            status = db.query(models.LiveStatus).filter(
                models.LiveStatus.saloon_id == s.id
            ).first()

            people = status.current_count if status else 0
            current_status = status.status if status else "AVAILABLE"
            
            # IST Timing formatting
            updated_str = "N/A"
            if status and status.updated_at:
                ist_time = status.updated_at.replace(tzinfo=pytz.utc).astimezone(ist_timezone)
                updated_str = ist_time.strftime("%I:%M:%S %p") + " (IST)"

            # 4. Wait time prediction (5 mins per person + 2 mins buffer)
            wait_time = (people * 5) + 2

            result.append({
                "id": s.id,
                "name": s.name,
                "distance": round(distance, 2),  # Distance in Kilometers
                "current_count": people,         # Live count from AI Camera
                "status": current_status,
                "wait_time": wait_time,          # Predicted wait time
                "latitude": s.latitude,
                "longitude": s.longitude,
                "updated_at": updated_str        # IST Last Updated Timstamp
            })

    # 5. Sorting: Nearest shop appears at the top (e.g., Kolaghat shop first if you are in Kolaghat)
    return sorted(result, key=lambda x: x["distance"])