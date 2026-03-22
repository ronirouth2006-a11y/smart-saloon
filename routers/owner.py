from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models, schemas, auth
from auth import get_current_user

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

    return {
        "message": "Registration Successful",
        "salon_id": new_salon.id
    }


# =========================================================
# 2️⃣ LOGIN OWNER
# =========================================================
@router.post("/login")
def login(data: schemas.OwnerLogin, db: Session = Depends(get_db)):

    owner = db.query(models.Owner).filter(models.Owner.email == data.email).first()

    if not owner or not auth.verify_password(data.password, owner.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth.create_token({"sub": owner.email})

    return {
        "access_token": token,
        "token_type": "bearer"
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
    db.commit()

    return {
        "message": "Shop status updated",
        "active": salon.is_active
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

    # Generate 7-day BarChart Footfall Data seamlessly
    days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    today_idx = datetime.utcnow().weekday()
    
    daily_data = []
    for i in range(7):
        day_label = days_of_week[(today_idx - 6 + i) % 7]
        # Simulate realistic daily curves with weekend spikes
        modifier = 1.4 if day_label in ["Sat", "Sun"] else 0.9
        daily_count = int(base_footfall * modifier * random.uniform(0.8, 1.2))
        daily_data.append({"day": day_label, "footfall": daily_count})

    # Generate Hourly LineChart Trend Data seamlessly
    hourly_data = [
        {"hour": "10 AM", "count": int(current_wait * 0.5)},
        {"hour": "11 AM", "count": int(current_wait * 0.8)},
        {"hour": "12 PM", "count": int(current_wait * 1.5)},
        {"hour": "01 PM", "count": int(current_wait * 1.8)},
        {"hour": "02 PM", "count": int(current_wait * 1.2)},
        {"hour": "03 PM", "count": int(current_wait * 0.7)},
        {"hour": "04 PM", "count": int(current_wait * 0.5)},
        {"hour": "05 PM", "count": int(current_wait * 1.0)},
        {"hour": "06 PM", "count": int(current_wait * 2.0)},
        {"hour": "07 PM", "count": int(current_wait * 1.8)},
    ]

    return {
        "daily": daily_data,
        "hourly": hourly_data
    }

