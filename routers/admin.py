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
    salons = db.query(models.Saloon).filter(models.Saloon.is_approved == False).all()
    return salons

@router.put("/salons/{salon_id}/approve")
def approve_salon(salon_id: int, db: Session = Depends(get_db)):
    salon = db.query(models.Saloon).filter(models.Saloon.id == salon_id).first()
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    
    salon.is_approved = True
    db.commit()
    return {"message": f"Salon {salon.name} approved successfully. It is now live."}
