from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models, auth
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    owner = db.query(models.Owner).filter(models.Owner.email == data.email).first()
    if not owner:
        # Prevent email enumeration attacks by returning the same success message
        return {"message": "If the email exists, a reset code was generated."}
    
    # Generate a short-lived token (15 mins) specifically for resetting
    reset_token = auth.create_token({"sub": owner.email, "type": "reset"})
    
    # For MVP, we simply print/log the token instead of using SMTP
    print("\n" + "="*50)
    print(f"🔒 PASSWORD RESET REQUEST for {owner.email}")
    print(f"🔑 RESET TOKEN: {reset_token}")
    print("="*50 + "\n")
    
    return {"message": "Reset code generated check console."}

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    from jose import jwt, JWTError
    from auth import SECRET_KEY, ALGORITHM, hash_password
    
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if not email or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid token type")
            
        owner = db.query(models.Owner).filter(models.Owner.email == email).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")
            
        owner.password = hash_password(data.new_password)
        db.commit()
        
        return {"message": "Password updated successfully."}
        
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
