from fastapi import APIRouter, HTTPException
import models, auth
from pydantic import BaseModel
from jose import jwt, JWTError
from auth import SECRET_KEY, ALGORITHM, hash_password

router = APIRouter(prefix="/auth", tags=["Auth"])

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    # 🍃 MongoDB Async Lookup
    owner = await models.Owner.find_one(models.Owner.email == data.email)
    if not owner:
        # Prevent email enumeration attacks
        return {"message": "If the email exists, a reset code was generated."}
    
    # Generate a short-lived token (15 mins) specifically for resetting
    reset_token = auth.create_token({"sub": owner.email, "type": "reset"})
    
    # Log the token (SMTP placeholder)
    print("\n" + "="*50)
    print(f"🔒 PASSWORD RESET REQUEST for {owner.email}")
    print(f"🔑 RESET TOKEN: {reset_token}")
    print("="*50 + "\n")
    
    return {"message": "Reset code generated check console."}

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if not email or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid token type")
            
        # 🍃 MongoDB Async Lookup
        owner = await models.Owner.find_one(models.Owner.email == email)
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")
            
        # Update and Save
        owner.password = hash_password(data.new_password)
        await owner.save()
        
        return {"message": "Password updated successfully."}
        
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
