from fastapi import APIRouter, Request, HTTPException
import models
import math
import pytz
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/public", tags=["Public"])

# 🌍 Haversine distance formula
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# 🚀 MAIN API: Finds nearby salons
@router.get("/salons/nearby")
async def get_nearby(
    user_lat: float, 
    user_lon: float, 
    request: Request,
    search: str = None
):
    from auth import get_optional_user
    
    # Check if a customer is logged in
    email = get_optional_user(request)
    user_fav_ids = []
    if email:
        user = await models.User.find_one(models.User.email == email)
        if user:
            user_fav_ids = user.favorite_salon_ids or []
            
    # 1. Fetch approved shops from MongoDB
    query = models.Saloon.find(models.Saloon.is_approved == True)
    if search:
        # Simple case-insensitive regex search for MongoDB
        query = query.find({"name": {"$regex": search, "$options": "i"}})
    
    salons = await query.to_list()
    result = []
    ist_timezone = pytz.timezone('Asia/Kolkata')

    for s in salons:
        if s.latitude is not None and s.longitude is not None:
            distance = haversine(user_lat, user_lon, s.latitude, s.longitude)

            # 3. Get Live Crowd Count
            status = await models.LiveStatus.find_one(models.LiveStatus.saloon_id == str(s.id))
            people = status.current_count if status else 0
            
            updated_str = "N/A"
            if status and status.updated_at:
                ist_time = status.updated_at.replace(tzinfo=timezone.utc).astimezone(ist_timezone)
                updated_str = ist_time.strftime("%I:%M:%S %p") + " (IST)"

            total_people = people + (s.manual_offset or 0)
            wait_time = total_people * 5 if s.is_active else 0
            
            display_status = "AVAILABLE" if total_people < 5 else "BUSY"
            
            # AI Camera Timeout check
            if status and status.updated_at:
                time_diff = datetime.now(timezone.utc) - status.updated_at.replace(tzinfo=timezone.utc)
                if time_diff > timedelta(minutes=5):
                    display_status = "NO LIVE FEED"
            
            if not s.is_active:
                display_status = "OFFLINE"

            result.append({
                "id": str(s.id),
                "name": s.name,
                "distance": round(distance, 2),
                "current_count": total_people if s.is_active else 0,
                "wait_time": wait_time,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "updated_at": updated_str,
                "is_favorited": str(s.id) in user_fav_ids,
                "is_active": s.is_active,
                "status": display_status
            })

    return sorted(result, key=lambda x: x["distance"])

# 🎯 SINGLE SALON API
@router.get("/salons/{salon_id}")
async def get_single_salon(
    salon_id: str,
    request: Request
):
    ist_timezone = pytz.timezone('Asia/Kolkata')
    from auth import get_optional_user

    email = get_optional_user(request)
    user_fav_ids = []
    if email:
        user = await models.User.find_one(models.User.email == email)
        if user:
            user_fav_ids = user.favorite_salon_ids or []

    s = await models.Saloon.get(salon_id)
    if not s:
        raise HTTPException(status_code=404, detail="Salon not found")

    status = await models.LiveStatus.find_one(models.LiveStatus.saloon_id == str(s.id))
    
    people = status.current_count if status else 0
    total_people = people + (s.manual_offset or 0)
    wait_time = (total_people * 5) + 2 if total_people > 0 and s.is_active else 0
    
    display_status = "AVAILABLE" if total_people < 5 else "BUSY"
    if status and status.updated_at:
        time_diff = datetime.now(timezone.utc) - status.updated_at.replace(tzinfo=timezone.utc)
        if time_diff > timedelta(minutes=5):
            display_status = "NO LIVE FEED"
            
    if not s.is_active:
        display_status = "OFFLINE"
        
    updated_str = "N/A"
    if status and status.updated_at:
        ist_time = status.updated_at.replace(tzinfo=timezone.utc).astimezone(ist_timezone)
        updated_str = ist_time.strftime("%I:%M:%S %p") + " (IST)"

    # Fetch barbers
    barbers = await models.Barber.find(models.Barber.saloon_id == str(s.id)).to_list()
    barber_list = [{"id": str(b.id), "name": b.name, "specialty": b.specialty, "is_available": b.is_available} for b in barbers]

    return {
        "id": str(s.id),
        "name": s.name,
        "latitude": s.latitude,
        "longitude": s.longitude,
        "current_count": total_people if s.is_active else 0,
        "manual_offset": s.manual_offset or 0,
        "camera_count": people,
        "wait_time": wait_time,
        "updated_at": updated_str,
        "is_favorited": str(s.id) in user_fav_ids,
        "is_active": s.is_active,
        "last_updated_at": status.updated_at.isoformat() if status and status.updated_at else None,
        "barbers": barber_list
    }