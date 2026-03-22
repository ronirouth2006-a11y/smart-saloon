from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models, schemas, auth
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/customer", tags=["Customer"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(data: schemas.CustomerRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(
        name=data.name,
        email=data.email,
        password=auth.hash_password(data.password),
        is_customer=True
    )
    db.add(new_user)
    db.commit()
    return {"message": "Customer registered successfully"}

@router.post("/login")
def login(data: schemas.CustomerLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not auth.verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = auth.create_token({"sub": user.email, "type": "customer"})
    
    # Return favorites immediately on login so React can cache them
    favorites_list = [f.id for f in user.favorites]
    
    return {
        "access_token": token, 
        "token_type": "bearer",
        "favorites": favorites_list
    }

class SyncFavorites(BaseModel):
    salon_ids: List[int]

@router.post("/favorites/sync")
def sync_favorites(data: SyncFavorites, db: Session = Depends(get_db), email: str = Depends(auth.get_current_user)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Sync favorites by entirely overriding with the provided array
    saloons = db.query(models.Saloon).filter(models.Saloon.id.in_(data.salon_ids)).all()
    user.favorites = saloons
    db.commit()
    
    return {"message": "Favorites successfully synced to database", "favorites": [s.id for s in user.favorites]}
