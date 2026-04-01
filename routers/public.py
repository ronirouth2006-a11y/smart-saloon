from fastapi import APIRouter, Depends, Request
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
def get_nearby(
    user_lat: float, 
    user_lon: float, 
    request: Request,
    search: str = None,
    db: Session = Depends(get_db)
):
    import pytz
    from auth import get_optional_user
    
    # Check if a customer is logged in (silently fails if not)
    email = get_optional_user(request)
    user_fav_ids = set()
    if email:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            user_fav_ids = {f.id for f in user.favorites}
            
    # 1. Fetch shops from the database
    query = db.query(models.Saloon).filter(models.Saloon.is_approved == True)
    if search:
        query = query.filter(models.Saloon.name.ilike(f"%{search}%"))
    
    salons = query.all()

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

            import pytz
            from datetime import datetime, timedelta

            # 4. Wait time prediction (5 mins per person + 2 mins buffer)
            wait_time = (people * 5) + 2

            # 5. Determine display status
            display_status = "AVAILABLE" if people < 5 else "BUSY"
            
            # Check for AI Camera Timeout (>5 mins since last ping)
            if status and status.updated_at:
                time_diff = datetime.utcnow() - status.updated_at.replace(tzinfo=None)
                if time_diff > timedelta(minutes=5):
                    display_status = "NO LIVE FEED"
            
            if not s.is_active:
                display_status = "OFFLINE"

            result.append({
                "id": s.id,
                "name": s.name,
                "distance": round(distance, 2),
                "current_count": people,
                "wait_time": wait_time,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "updated_at": updated_str,
                "is_favorited": s.id in user_fav_ids,
                "is_active": s.is_active,
                "status": display_status
            })

    # 5. Sorting: Nearest shop appears at the top (e.g., Kolaghat shop first if you are in Kolaghat)
    return sorted(result, key=lambda x: x["distance"])

# =========================================================
# 🎯 QR CODE DIRECT FETCH API: Loads a single salon for exactly /salons/{id}
# =========================================================
@router.get("/salons/{salon_id}")
def get_single_salon(
    salon_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    import pytz
    from auth import get_optional_user

    email = get_optional_user(request)
    user_fav_ids = set()
    if email:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            user_fav_ids = {f.id for f in user.favorites}

    s = db.query(models.Saloon).filter(models.Saloon.id == salon_id).first()
    if not s:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Salon not found")

    status = db.query(models.LiveStatus).filter(models.LiveStatus.saloon_id == s.id).first()
    
    people = status.current_count if status else 0
    current_status = status.status if status else "AVAILABLE"
    
    wait_time = (people * 5) + 2 if people > 0 else 0
    
    display_status = "AVAILABLE" if people < 5 else "BUSY"
    if status and status.updated_at:
        from datetime import datetime, timedelta
        time_diff = datetime.utcnow() - status.updated_at.replace(tzinfo=None)
        if time_diff > timedelta(minutes=5):
            display_status = "NO LIVE FEED"
            
    if not s.is_active:
        display_status = "OFFLINE"
    updated_str = "N/A"
    if status and status.updated_at:
        ist_time = status.updated_at.replace(tzinfo=pytz.utc).astimezone(ist_timezone)
        updated_str = ist_time.strftime("%I:%M:%S %p") + " (IST)"

    # Fetch barbers
    barbers = db.query(models.Barber).filter(models.Barber.saloon_id == s.id).all()
    barber_list = [{"id": b.id, "name": b.name, "specialty": b.specialty, "is_available": b.is_available} for b in barbers]

    return {
        "id": s.id,
        "name": s.name,
        "latitude": s.latitude,
        "longitude": s.longitude,
        "current_count": people,
        "wait_time": wait_time,
        "updated_at": updated_str,
        "is_favorited": s.id in user_fav_ids,
        "is_active": s.is_active,
        "barbers": barber_list
    }