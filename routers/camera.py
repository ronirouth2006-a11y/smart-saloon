from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import LiveStatus
import models
from schemas import CameraUpdate
from datetime import datetime
from config import settings

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 🔐 Camera API key verification
def verify_camera_key(x_api_key: str = Header(...)):
    if x_api_key != settings.CAMERA_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid camera key")

@router.post("/camera/update-count")
def update_count(
    data: CameraUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_camera_key)  # security dependency
):

    if data.people <= 3:
        status = "AVAILABLE"
    elif data.people <= 6:
        status = "MEDIUM"
    else:
        status = "BUSY"

    record = db.query(LiveStatus).filter(
        LiveStatus.saloon_id == data.saloon_id
    ).first()

    if record:
        record.current_count = data.people
        record.status = status
        record.updated_at = datetime.utcnow()
    else:
        record = LiveStatus(
            saloon_id=data.saloon_id,
            current_count=data.people,
            status=status
        )
        db.add(record)

    # Analytics update
    analytics = db.query(models.Analytics).filter(
        models.Analytics.saloon_id == data.saloon_id
    ).first()

    if not analytics:
        analytics = models.Analytics(saloon_id=data.saloon_id)
        db.add(analytics)

    analytics.total_customers_today += 1

    db.commit()

    return {"message": "Count updated"}