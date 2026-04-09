from fastapi import APIRouter, Header, HTTPException, Depends
from models import LiveStatus
import models
from schemas import CameraUpdate
from datetime import datetime, timezone
from config import settings

router = APIRouter()

# 🔐 Camera API key verification
def verify_camera_key(x_api_key: str = Header(...)):
    if x_api_key != settings.CAMERA_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid camera key")

@router.post("/camera/update-count")
async def update_count(
    data: CameraUpdate,
    _: str = Depends(verify_camera_key)  # security dependency
):
    # 🍃 Logic for crowd status
    if data.people <= 3:
        status = "AVAILABLE"
    elif data.people <= 6:
        status = "MEDIUM"
    else:
        status = "BUSY"

    # 🍃 Find or Create LiveStatus for the salon
    record = await LiveStatus.find_one(LiveStatus.saloon_id == data.saloon_id)

    if record:
        record.current_count = data.people
        record.status = status
        record.updated_at = datetime.now(timezone.utc)
        await record.save()
    else:
        record = LiveStatus(
            saloon_id=data.saloon_id,
            current_count=data.people,
            status=status
        )
        await record.insert()

    # 📈 Analytics update
    analytics = await models.Analytics.find_one(models.Analytics.saloon_id == data.saloon_id)

    if not analytics:
        analytics = models.Analytics(saloon_id=data.saloon_id)
        await analytics.insert()

    # Increment today's count
    analytics.total_customers_today = (analytics.total_customers_today or 0) + 1
    await analytics.save()

    return {"message": "Count updated"}