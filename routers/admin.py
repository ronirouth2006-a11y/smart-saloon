from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from typing import List

# A very simple unprotected Admin route for MVP.
# In a real app, protect this with JWT and roles!
router = APIRouter(prefix="/admin", tags=["Admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/salons/pending")
def get_pending_salons(db: Session = Depends(get_db)):
    # Only show salons that are NOT yet approved AND NOT yet rejected
    salons = db.query(models.Saloon).filter(
        models.Saloon.is_approved == False, 
        models.Saloon.is_rejected == False
    ).all()
    return salons

@router.get("/salons/approved")
def get_approved_salons(db: Session = Depends(get_db)):
    salons = db.query(models.Saloon).filter(models.Saloon.is_approved == True).all()
    return salons

@router.put("/salons/{salon_id}/approve")
def approve_salon(salon_id: int, db: Session = Depends(get_db)):
    salon = db.query(models.Saloon).filter(models.Saloon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    
    salon.is_approved = True
    db.commit()
    return {"message": f"Salon {salon.name} approved successfully. It is now live."}

@router.delete("/salons/{salon_id}/reject")
def reject_salon(salon_id: int, db: Session = Depends(get_db)):
    salon = db.query(models.Saloon).filter(models.Saloon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    
    # NEW: Instead of deleting, we mark as rejected so the owner sees a reason.
    # We still keep the record to prevent re-registration with the same details if needed,
    # but more importantly to show the user they were rejected.
    salon.is_rejected = True
    salon.is_approved = False
    
    db.commit()
    return {"message": "Registration marked as rejected. Owner will see this status."}

@router.delete("/salons/{salon_id}/permanent")
def permanent_delete_salon(salon_id: int, db: Session = Depends(get_db)):
    salon = db.query(models.Saloon).filter(models.Saloon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    
    # 🧹 Cascaded Deletion: Remove all traces from associated tables
    db.query(models.LiveStatus).filter(models.LiveStatus.saloon_id == salon_id).delete()
    db.query(models.Analytics).filter(models.Analytics.saloon_id == salon_id).delete()
    db.query(models.Barber).filter(models.Barber.saloon_id == salon_id).delete()
    
    # Association table deletion
    db.execute(models.user_favorites.delete().where(models.user_favorites.c.saloon_id == salon_id))
    
    # Finally delete the salon itself
    db.delete(salon)
    db.commit()
    return {"message": f"Salon {salon.name} and all associated data permanently deleted."}
