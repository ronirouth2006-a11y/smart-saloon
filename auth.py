from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import hashlib
# Configuration
from config import settings

SECRET_KEY = settings.SECRET_KEY 
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="owner/login") # Matches your login route
admin_oauth_scheme = OAuth2PasswordBearer(tokenUrl="admin/api/v1/login")

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# 1. Password Security
def hash_password(password: str):
    # Passlib bcrypt throws an error if the password > 72 chars
    # We pre-hash with SHA256 to guarantee smaller, fixed length (64 hex characters)
    pre_hashed = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return pwd_context.hash(pre_hashed)

def verify_password(password: str, hashed: str):
    pre_hashed = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return pwd_context.verify(pre_hashed, hashed)

# 2. Token Generation
def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

from fastapi import Request

# 3. Security Guard: Verify the User
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodes the token sent from admin.html
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub") # The 'sub' key holds the owner's email
        if email is None:
            raise credentials_exception
        return email
    except JWTError:
        raise credentials_exception

def get_admin_user(token: str = Depends(admin_oauth_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role != "super_admin":
            raise credentials_exception
        return email
    except JWTError:
        raise credentials_exception

# 4. Optional Security Guard for Public routes
def get_optional_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
