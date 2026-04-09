from fastapi import APIRouter, HTTPException
import models

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/salons/pending")
async def get_pending_salons():
    # 🍃 MongoDB Async Query
    return await models.Saloon.find(
        models.Saloon.is_approved == False, 
        models.Saloon.is_rejected == False
    ).to_list()

@router.get("/salons/approved")
async def get_approved_salons():
    return await models.Saloon.find(models.Saloon.is_approved == True).to_list()

@router.put("/salons/{salon_id}/approve")
async def approve_salon(salon_id: str):
    salon = await models.Saloon.get(salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    
    salon.is_approved = True
    await salon.save()
    return {"message": f"Salon {salon.name} approved successfully."}

@router.delete("/salons/{salon_id}/reject")
async def reject_salon(salon_id: str):
    salon = await models.Saloon.get(salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    
    salon.is_rejected = True
    salon.is_approved = False
    await salon.save()
    return {"message": "Registration marked as rejected."}

@router.delete("/salons/{salon_id}/permanent")
async def permanent_delete_salon(salon_id: str):
    salon = await models.Saloon.get(salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    
    # 🧹 Manual Cascade Deletion for MongoDB
    await models.LiveStatus.find(models.LiveStatus.saloon_id == salon_id).delete()
    await models.Analytics.find(models.Analytics.saloon_id == salon_id).delete()
    await models.Barber.find(models.Barber.saloon_id == salon_id).delete()
    
    # Remove from all users' favorites
    await models.User.find({"favorite_salon_ids": salon_id}).update({"$pull": {"favorite_salon_ids": salon_id}})
    
    # Finally delete the salon
    await salon.delete()
    return {"message": f"Salon {salon.name} and all associated data permanently deleted."}
