from fastapi import APIRouter, Depends, HTTPException
import models, schemas, auth
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/customer", tags=["Customer"])

@router.post("/register")
async def register(data: schemas.CustomerRegister):
    existing = await models.User.find_one(models.User.email == data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
        name=data.name,
        email=data.email,
        password=auth.hash_password(data.password),
        is_customer=True,
        favorite_salon_ids=[]
    )
    await new_user.insert()
    return {"message": "Customer registered successfully"}

@router.post("/login")
async def login(data: schemas.CustomerLogin):
    user = await models.User.find_one(models.User.email == data.email)
    if not user or not auth.verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = auth.create_token({"sub": user.email, "type": "customer"})
    
    return {
        "access_token": token, 
        "token_type": "bearer",
        "favorites": user.favorite_salon_ids
    }

class SyncFavorites(BaseModel):
    salon_ids: List[str]  # Changed to str for MongoDB IDs

@router.post("/favorites/sync")
async def sync_favorites(data: SyncFavorites, email: str = Depends(auth.get_current_user)):
    user = await models.User.find_one(models.User.email == email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Simple sync: just update the list of strings
    user.favorite_salon_ids = data.salon_ids
    await user.save()
    
    return {
        "message": "Favorites successfully synced to database", 
        "favorites": user.favorite_salon_ids
    }
