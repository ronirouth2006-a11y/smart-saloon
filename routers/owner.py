from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
import models, schemas, auth
from datetime import datetime, timezone, timedelta
from auth import get_current_user
import uuid
import os
import shutil
import pytz
import random
import logging

logger = logging.getLogger("smart_saloon")

router = APIRouter(prefix="/owner", tags=["Owner"])

# =========================================================
# 1️⃣ REGISTER OWNER + SALON
# =========================================================
@router.post("/register")
async def register_owner_and_salon(data: schemas.OwnerRegister):
    # 🔍 Check existing email
    existing_owner = await models.Owner.find_one(models.Owner.email == data.email)
    if existing_owner:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 🛑 Anti-Duplicate System
    existing_salon = await models.Saloon.find_one({"name": {"$regex": f"^{data.salon_name}$", "$options": "i"}})
    if existing_salon:
        raise HTTPException(status_code=400, detail="A salon with this name exists.")

    # 👤 Create Owner
    new_owner = models.Owner(
        name=data.owner_name,
        email=data.email,
        password=auth.hash_password(data.password),
        phone=data.phone
    )
    await new_owner.insert()

    # 🏪 Create Salon
    new_salon = models.Saloon(
        owner_id=str(new_owner.id),
        name=data.salon_name,
        location=data.location, 
        latitude=data.latitude,
        longitude=data.longitude,
        assistant_phone=data.phone,
        is_active=True
    )
    await new_salon.insert()

    # 📊 Create Live Status
    new_status = models.LiveStatus(
        saloon_id=str(new_salon.id),
        current_count=0,
        status="AVAILABLE"
    )
    await new_status.insert()

    token = auth.create_token({"sub": new_owner.email})

    return {
        "message": "Registration Successful",
        "salon_id": str(new_salon.id),
        "access_token": token
    }

# =========================================================
# 2️⃣ LOGIN OWNER
# =========================================================
@router.post("/login")
async def login(data: schemas.OwnerLogin):
    owner = await models.Owner.find_one(models.Owner.email == data.email)

    if not owner or not auth.verify_password(data.password, owner.password):
        logger.warning(f"Failed login attempt for owner email: {data.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    salon = await models.Saloon.find_one(models.Saloon.owner_id == str(owner.id))
    
    if salon:
        if salon.is_rejected:
            raise HTTPException(status_code=403, detail="Registration Rejected")
        if not salon.is_approved:
            raise HTTPException(status_code=403, detail="Registration Pending")

    token = auth.create_token({"sub": owner.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "saloon_id": str(salon.id) if salon else None
    }

# =========================================================
# 3️⃣ TOGGLE SHOP OPEN / CLOSE
# =========================================================
@router.put("/toggle-status")
async def toggle_status(
    data: schemas.SalonStatusUpdate,
    email: str = Depends(get_current_user)
):
    owner = await models.Owner.find_one(models.Owner.email == email)
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    salon = await models.Saloon.find_one(models.Saloon.owner_id == str(owner.id))
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    salon.is_active = data.is_active
    await salon.save()
    
    # Refresh LiveStatus timestamp
    status = await models.LiveStatus.find_one(models.LiveStatus.saloon_id == str(salon.id))
    if status:
        status.updated_at = datetime.now(timezone.utc)
        await status.save()
        
    return {"message": "Shop status updated", "active": salon.is_active}

# =========================================================
# 3.5️⃣ UPLOAD STOREFRONT PHOTO
# =========================================================
@router.post("/{salon_id}/upload-photo")
async def upload_storefront_photo(
    salon_id: str,
    file: UploadFile = File(...),
    email: str = Depends(get_current_user)
):
    owner = await models.Owner.find_one(models.Owner.email == email)
    salon = await models.Saloon.get(salon_id)

    if not salon or salon.owner_id != str(owner.id):
        raise HTTPException(status_code=404, detail="Salon not found or unauthorized")

    file_ext = file.filename.split(".")[-1].lower()
    valid_extensions = {"jpg", "jpeg", "png", "webp"}
    valid_content_types = {"image/jpeg", "image/png", "image/webp"}
    if file_ext not in valid_extensions or getattr(file, "content_type", "") not in valid_content_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG, PNG, and WEBP allowed.")
        
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = f"static/uploads/salons/{unique_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    salon.storefront_photo_url = f"/static/uploads/salons/{unique_filename}"
    await salon.save()

    return {"message": "Photo uploaded successfully", "url": salon.storefront_photo_url}

# =========================================================
# 3.6️⃣ MANUAL OVERRIDE (Update Crowd)
# =========================================================
@router.put("/live-status")
async def update_live_crowd(
    current_count: int = Query(..., ge=0),
    email: str = Depends(get_current_user)
):
    owner = await models.Owner.find_one(models.Owner.email == email)
    salon = await models.Saloon.find_one(models.Saloon.owner_id == str(owner.id))

    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    live_status = await models.LiveStatus.find_one(models.LiveStatus.saloon_id == str(salon.id))
    if not live_status:
        raise HTTPException(status_code=404, detail="Live status record not found")

    live_status.current_count = current_count
    
    # Auto-calculate status
    if current_count >= salon.max_limit:
        live_status.status = "BUSY"
    elif current_count >= (salon.max_limit // 2):
        live_status.status = "MEDIUM"
    else:
        live_status.status = "AVAILABLE"

    live_status.updated_at = datetime.now(timezone.utc)
    await live_status.save()

    return {
        "message": "Crowd count updated successfully",
        "current_count": live_status.current_count,
        "status": live_status.status
    }

# =========================================================
# 4️⃣ OWNER ANALYTICS
# =========================================================
@router.get("/analytics/{salon_id}")
async def get_analytics(
    salon_id: str,
    email: str = Depends(get_current_user)
):
    # Verify ownership
    owner = await models.Owner.find_one(models.Owner.email == email)
    salon = await models.Saloon.get(salon_id)
    if not salon or salon.owner_id != str(owner.id):
        raise HTTPException(status_code=404, detail="Salon not found")

    analytics = await models.Analytics.find_one(models.Analytics.saloon_id == salon_id)
    if not analytics:
        return {"total_customers": 0, "peak_hour": "N/A"}

    return {
        "total_customers": analytics.total_customers_today,
        "peak_hour": analytics.peak_hour
    }

# =========================================================
# 5️⃣ WEEKLY & HOURLY CHART ANALYTICS
# =========================================================
@router.get("/analytics/{salon_id}/weekly")
async def get_weekly_analytics(
    salon_id: str,
    email: str = Depends(get_current_user)
):
    owner = await models.Owner.find_one(models.Owner.email == email)
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
        
    salon = await models.Saloon.get(salon_id)
    if not salon or salon.owner_id != str(owner.id):
        raise HTTPException(status_code=404, detail="Salon not found")
        
    analytics = await models.Analytics.find_one(models.Analytics.saloon_id == salon_id)
    live_status = await models.LiveStatus.find_one(models.LiveStatus.saloon_id == salon_id)
    
    base_footfall = analytics.total_customers_today if analytics and analytics.total_customers_today > 10 else 120
    current_wait = live_status.current_count if live_status else 5

    ist_timezone = pytz.timezone('Asia/Kolkata')
    now_ist = datetime.now(ist_timezone)

    # Simulated data generation for Recharts
    days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    today_idx = now_ist.weekday()
    
    daily_data = []
    for i in range(7):
        day_label = days_of_week[(today_idx - 6 + i) % 7]
        modifier = 1.4 if day_label in ["Sat", "Sun"] else 0.9
        daily_count = int(base_footfall * modifier * random.uniform(0.8, 1.2))
        daily_data.append({"day": day_label, "footfall": daily_count})

    hourly_data = []
    for i in range(10):
        past_hour = now_ist - timedelta(hours=(9 - i))
        hour_label = past_hour.strftime("%I %p")
        hour_int = past_hour.hour
        demand_curve = 1.0
        if 11 <= hour_int <= 14: demand_curve = 1.6
        elif 17 <= hour_int <= 20: demand_curve = 1.8
        elif 22 <= hour_int or hour_int <= 7: demand_curve = 0.3
        
        count = int(current_wait * demand_curve * random.uniform(0.7, 1.3))
        if i == 9: count = current_wait
        hourly_data.append({"hour": hour_label, "count": count})

    return {"daily": daily_data, "hourly": hourly_data}

# =========================================================
# 6️⃣ STAFF MANAGEMENT (BARBERS)
# =========================================================
@router.get("/barbers", response_model=list[schemas.BarberResponse])
async def get_barbers(email: str = Depends(get_current_user)):
    owner = await models.Owner.find_one(models.Owner.email == email)
    salon = await models.Saloon.find_one(models.Saloon.owner_id == str(owner.id))
    barbers = await models.Barber.find(models.Barber.saloon_id == str(salon.id)).to_list()
    return [schemas.BarberResponse(id=str(b.id), name=b.name, specialty=b.specialty, is_available=b.is_available) for b in barbers]

@router.post("/barbers", response_model=schemas.BarberResponse)
async def add_barber(data: schemas.BarberCreate, email: str = Depends(get_current_user)):
    owner = await models.Owner.find_one(models.Owner.email == email)
    salon = await models.Saloon.find_one(models.Saloon.owner_id == str(owner.id))
    
    new_barber = models.Barber(
        saloon_id=str(salon.id),
        name=data.name,
        specialty=data.specialty,
        is_available=True
    )
    await new_barber.insert()
    return schemas.BarberResponse(id=str(new_barber.id), name=new_barber.name, specialty=new_barber.specialty, is_available=new_barber.is_available)

@router.delete("/barbers/{barber_id}")
async def delete_barber(barber_id: str, email: str = Depends(get_current_user)):
    owner = await models.Owner.find_one(models.Owner.email == email)
    salon = await models.Saloon.find_one(models.Saloon.owner_id == str(owner.id))
    
    barber = await models.Barber.find_one(models.Barber.id == barber_id, models.Barber.saloon_id == str(salon.id))
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
        
    await barber.delete()
    return {"message": "Barber removed"}

# =========================================================
# 7️⃣ SALON SETTINGS UPDATE
# =========================================================
@router.patch("/salon")
async def update_salon(data: schemas.SalonUpdate, email: str = Depends(get_current_user)):
    owner = await models.Owner.find_one(models.Owner.email == email)
    salon = await models.Saloon.find_one(models.Saloon.owner_id == str(owner.id))
    
    if data.name is not None: salon.name = data.name
    if data.max_limit is not None: salon.max_limit = data.max_limit
    if data.assistant_phone is not None: salon.assistant_phone = data.assistant_phone
    if data.latitude is not None: salon.latitude = data.latitude
    if data.longitude is not None: salon.longitude = data.longitude
    if data.camera_url is not None: salon.camera_url = data.camera_url
    if data.manual_offset is not None: salon.manual_offset = data.manual_offset
    
    await salon.save()
    return {"message": "Salon settings updated"}
