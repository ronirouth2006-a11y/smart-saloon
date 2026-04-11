from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import models
import schemas
from auth import get_admin_user, create_token, verify_password

router = APIRouter(prefix="/admin/api/v1", tags=["Admin"])

@router.post("/login")
async def login_admin(credentials: schemas.AdminLogin):
    user = await models.AdminUser.find_one(models.AdminUser.email == credentials.email)
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate token with sub and role
    token = create_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/salons/pending")
async def get_pending_salons(admin_email: str = Depends(get_admin_user)):
    salons = await models.Saloon.find(
        models.Saloon.is_approved == False, 
        models.Saloon.is_rejected == False
    ).to_list()
    return [{**s.dict(), "id": str(s.id)} for s in salons]

@router.get("/salons/approved")
async def get_approved_salons(admin_email: str = Depends(get_admin_user)):
    salons = await models.Saloon.find(models.Saloon.is_approved == True).to_list()
    return [{**s.dict(), "id": str(s.id)} for s in salons]

@router.put("/salons/{salon_id}/approve")
async def approve_salon(salon_id: str, admin_email: str = Depends(get_admin_user)):
    salon = await models.Saloon.get(salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    
    salon.is_approved = True
    salon.approved_by = admin_email
    salon.approved_at = datetime.now(timezone.utc)
    await salon.save()
    return {"message": f"Salon {salon.name} approved successfully.", "approved_by": admin_email}

@router.delete("/salons/{salon_id}/reject")
async def reject_salon(salon_id: str, admin_email: str = Depends(get_admin_user)):
    salon = await models.Saloon.get(salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    
    salon.is_rejected = True
    salon.is_approved = False
    await salon.save()
    return {"message": "Registration marked as rejected."}

@router.delete("/salons/{salon_id}/permanent")
async def permanent_delete_salon(salon_id: str, admin_email: str = Depends(get_admin_user)):
    salon = await models.Saloon.get(salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    
    # Cascade partial deletion mappings
    await models.LiveStatus.find(models.LiveStatus.saloon_id == salon_id).delete()
    await models.Analytics.find(models.Analytics.saloon_id == salon_id).delete()
    await models.Barber.find(models.Barber.saloon_id == salon_id).delete()
    await models.User.find({"favorite_salon_ids": salon_id}).update({"$pull": {"favorite_salon_ids": salon_id}})
    await salon.delete()
    return {"message": f"Salon {salon.name} and all associated data permanently deleted."}

@router.get("/heartbeats")
async def get_heartbeats(admin_email: str = Depends(get_admin_user)):
    salons = await models.Saloon.find(models.Saloon.is_active == True).to_list()
    results = []
    for salon in salons:
        live_status = await models.LiveStatus.find_one(models.LiveStatus.saloon_id == str(salon.id))
        updated_at = live_status.updated_at if live_status else None
        results.append({
            "salon_id": str(salon.id),
            "salon_name": salon.name,
            "last_pulse": updated_at
        })
    return results
