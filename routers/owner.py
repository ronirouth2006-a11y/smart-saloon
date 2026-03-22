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
# 5️⃣ HOURLY CHART ANALYTICS 
# =========================================================
@router.get("/analytics/{salon_id}/hourly")
def get_hourly_analytics(salon_id: int, db: Session = Depends(get_db)):
    # Returns simulated historical data grouped by hour for Recharts
    # In a full prod app this merges with a historical database table.
    return [
        {"hour": "10 AM", "count": 5},
        {"hour": "11 AM", "count": 8},
        {"hour": "12 PM", "count": 14},
        {"hour": "01 PM", "count": 18},
        {"hour": "02 PM", "count": 12},
        {"hour": "03 PM", "count": 7},
        {"hour": "04 PM", "count": 4},
        {"hour": "05 PM", "count": 9},
        {"hour": "06 PM", "count": 15},
    ]

