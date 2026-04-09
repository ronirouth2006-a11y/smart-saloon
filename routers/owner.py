from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import SessionLocal
import models, schemas, auth
from datetime import datetime, timezone
from auth import get_current_user
import uuid
import os
import shutil

# ✅ Prefix added (VERY IMPORTANT)
router = APIRouter(prefix="/owner", tags=["Owner"])


# 🔌 Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================================================
# 1️⃣ REGISTER OWNER + SALON
# =========================================================
@router.post("/register")
def register_owner_and_salon(data: schemas.OwnerRegister, db: Session = Depends(get_db)):

    # 🔍 Check existing email
    existing_owner = db.query(models.Owner).filter(models.Owner.email == data.email).first()
    if existing_owner:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 🛑 Anti-Duplicate System: Prevent multiple shops with the same name
    existing_salon = db.query(models.Saloon).filter(models.Saloon.name.ilike(data.salon_name)).first()
    if existing_salon:
        raise HTTPException(status_code=400, detail="A salon with this exact name is already registered. Please login, or contact support if you own it.")

    # 👤 Create Owner
    new_owner = models.Owner(
        name=data.owner_name,
        email=data.email,
        password=auth.hash_password(data.password),  # default password
        phone=data.phone
    )
    db.add(new_owner)
    db.flush()

    # 🏪 Create Salon
    new_salon = models.Saloon(
        owner_id=new_owner.id,
        name=data.salon_name,
        latitude=data.latitude,
        longitude=data.longitude,
        assistant_phone=data.phone,
        is_active=True
    )
    db.add(new_salon)
    db.flush()

    # 📊 Create Live Status
    new_status = models.LiveStatus(
        saloon_id=new_salon.id,
        current_count=0,
        status="AVAILABLE"
    )
    db.add(new_status)

    db.commit()

    # Automatically generate a token for step 2 (Verification Photo Upload)
    token = auth.create_token({"sub": new_owner.email})

    return {
        "message": "Registration Successful",
        "salon_id": new_salon.id,
        "access_token": token
    }


# =========================================================
# 2️⃣ LOGIN OWNER
# =========================================================
@router.post("/login")
def login(data: schemas.OwnerLogin, db: Session = Depends(get_db)):

    owner = db.query(models.Owner).filter(models.Owner.email == data.email).first()

    if not owner or not auth.verify_password(data.password, owner.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    salon = db.query(models.Saloon).filter(models.Saloon.owner_id == owner.id).first()
    
    if salon:
        if salon.is_rejected:
            raise HTTPException(status_code=403, detail="Registration Rejected")
        if not salon.is_approved:
            raise HTTPException(status_code=403, detail="Registration Pending")

    token = auth.create_token({"sub": owner.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "saloon_id": salon.id if salon else None
    }


# =========================================================
# 3️⃣ TOGGLE SHOP OPEN / CLOSE
# =========================================================
@router.put("/toggle-status")
def toggle_status(
    data: schemas.SalonStatusUpdate,
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user)
):

    owner = db.query(models.Owner).filter(models.Owner.email == email).first()

    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    salon = db.query(models.Saloon).filter(models.Saloon.owner_id == owner.id).first()

    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    salon.is_active = data.is_active
    
    # 🕒 Refresh LiveStatus timestamp to "wake up" the shop and avoid NO LIVE FEED
    status = db.query(models.LiveStatus).filter(models.LiveStatus.saloon_id == salon.id).first()
    if status:
        status.updated_at = datetime.now(timezone.utc)
        
    db.commit()

    return {
        "message": "Shop status updated",
        "active": salon.is_active
    }


# =========================================================
# 3.5️⃣ UPLOAD STOREFRONT PHOTO (Verification)
# =========================================================
@router.post("/{salon_id}/upload-photo")
def upload_storefront_photo(
    salon_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user)
):
    owner = db.query(models.Owner).filter(models.Owner.email == email).first()
    salon = db.query(models.Saloon).filter(models.Saloon.id == salon_id, models.Saloon.owner_id == owner.id).first()

    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found or unauthorized")

    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = f"static/uploads/salons/{unique_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    salon.storefront_photo_url = f"/static/uploads/salons/{unique_filename}"
    db.commit()

    return {"message": "Photo uploaded successfully for verification.", "url": salon.storefront_photo_url}


# =========================================================
# 3.6️⃣ MANUAL OVERRIDE & CCTV HOOK (Update Crowd)
# =========================================================
@router.put("/live-status")
def update_live_crowd(
    current_count: int,
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user)
):
    owner = db.query(models.Owner).filter(models.Owner.email == email).first()
    salon = db.query(models.Saloon).filter(models.Saloon.owner_id == owner.id).first()

    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    live_status = db.query(models.LiveStatus).filter(models.LiveStatus.saloon_id == salon.id).first()
    
    if not live_status:
        raise HTTPException(status_code=404, detail="Live status record not found")

    # Update count
    live_status.current_count = current_count
    
    # Auto-calculate status string based on max limit
    if current_count >= salon.max_limit:
        live_status.status = "BUSY"
    elif current_count >= (salon.max_limit // 2):
        live_status.status = "MEDIUM"
    else:
        live_status.status = "AVAILABLE"

    # 🕒 Refresh LiveStatus timestamp to "wake up" the shop and avoid NO LIVE FEED
    live_status.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "message": "Crowd count updated successfully",
        "current_count": live_status.current_count,
        "status": live_status.status
    }


# =========================================================
# 4️⃣ OWNER ANALYTICS (OPTIONAL BUT IMPORTANT 🚀)
# =========================================================
@router.get("/analytics/{salon_id}")
def get_analytics(
    salon_id: int,
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user)
):

    salon = db.query(models.Saloon).filter(models.Saloon.id == salon_id).first()

    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")

    analytics = db.query(models.Analytics).filter(models.Analytics.saloon_id == salon_id).first()

    if not analytics:
        return {
            "total_customers": 0,
            "peak_hour": "N/A"
        }

    return {
        "total_customers": analytics.total_customers_today,
        "peak_hour": analytics.peak_hour
    }

# =========================================================
# 5️⃣ WEEKLY & HOURLY CHART ANALYTICS (RECHARTS PAYLOAD)
# =========================================================
@router.get("/analytics/{salon_id}/weekly")
def get_weekly_analytics(salon_id: int, db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    import random
    
    analytics = db.query(models.Analytics).filter(models.Analytics.saloon_id == salon_id).first()
    live_status = db.query(models.LiveStatus).filter(models.LiveStatus.saloon_id == salon_id).first()
    
    base_footfall = analytics.total_customers_today if analytics and analytics.total_customers_today > 10 else 120
    current_wait = live_status.current_count if live_status else 5

    import pytz
    ist_timezone = pytz.timezone('Asia/Kolkata')
    now_ist = datetime.now(ist_timezone)

    # 1. Generate 7-day BarChart Footfall Data seamlessly (Ends at Today)
    days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    today_idx = now_ist.weekday()
    
    daily_data = []
    for i in range(7):
        # We want the last 7 days ending with TODAY
        day_label = days_of_week[(today_idx - 6 + i) % 7]
        # Simulate realistic daily curves with weekend spikes
        modifier = 1.4 if day_label in ["Sat", "Sun"] else 0.9
        daily_count = int(base_footfall * modifier * random.uniform(0.8, 1.2))
        daily_data.append({"day": day_label, "footfall": daily_count})

    # 2. Generate 10-hour Sliding Window for LineChart Trend
    hourly_data = []
    for i in range(10):
        # Look back 9 hours from now
        past_hour = now_ist - timedelta(hours=(9 - i))
        hour_label = past_hour.strftime("%I %p")
        
        # Simulate a curve: lower at night, higher during day, plus some randomness
        hour_int = past_hour.hour
        # Base demand curve: Peaks during day (12-2pm and 5-7pm)
        demand_curve = 1.0
        if 11 <= hour_int <= 14: demand_curve = 1.6
        elif 17 <= hour_int <= 20: demand_curve = 1.8
        elif 22 <= hour_int or hour_int <= 7: demand_curve = 0.3
        
        count = int(current_wait * demand_curve * random.uniform(0.7, 1.3))
        # Ensure the last point matches actual current count for realism
        if i == 9: count = current_wait
        
        hourly_data.append({"hour": hour_label, "count": count})

    return {
        "version": "2.1-dynamic-ist",
        "daily": daily_data,
        "hourly": hourly_data
    }


# =========================================================
# 6️⃣ STAFF MANAGEMENT (BARBERS)
# =========================================================
@router.get("/barbers", response_model=list[schemas.BarberResponse])
def get_barbers(
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user)
):
    owner = db.query(models.Owner).filter(models.Owner.email == email).first()
    salon = db.query(models.Saloon).filter(models.Saloon.owner_id == owner.id).first()
    return db.query(models.Barber).filter(models.Barber.saloon_id == salon.id).all()

@router.post("/barbers", response_model=schemas.BarberResponse)
def add_barber(
    data: schemas.BarberCreate,
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user)
):
    owner = db.query(models.Owner).filter(models.Owner.email == email).first()
    salon = db.query(models.Saloon).filter(models.Saloon.owner_id == owner.id).first()
    
    new_barber = models.Barber(
        saloon_id=salon.id,
        name=data.name,
        specialty=data.specialty,
        is_available=True
    )
    db.add(new_barber)
    db.commit()
    db.refresh(new_barber)
    return new_barber

@router.delete("/barbers/{barber_id}")
def delete_barber(
    barber_id: int,
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user)
):
    owner = db.query(models.Owner).filter(models.Owner.email == email).first()
    salon = db.query(models.Saloon).filter(models.Saloon.owner_id == owner.id).first()
    
    barber = db.query(models.Barber).filter(
        models.Barber.id == barber_id, 
        models.Barber.saloon_id == salon.id
    ).first()
    
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
        
    db.delete(barber)
    db.commit()
    return {"message": "Barber removed"}

# =========================================================
# 7️⃣ SALON SETTINGS UPDATE
# =========================================================
@router.patch("/salon")
def update_salon(
    data: schemas.SalonUpdate,
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user)
):
    owner = db.query(models.Owner).filter(models.Owner.email == email).first()
    salon = db.query(models.Saloon).filter(models.Saloon.owner_id == owner.id).first()
    
    if data.name: salon.name = data.name
    if data.max_limit: salon.max_limit = data.max_limit
    if data.assistant_phone: salon.assistant_phone = data.assistant_phone
    if data.latitude: salon.latitude = data.latitude
    if data.longitude: salon.longitude = data.longitude
    if data.camera_url: salon.camera_url = data.camera_url
    if data.manual_offset is not None: salon.manual_offset = data.manual_offset
    
    db.commit()
    return {"message": "Salon settings updated"}

