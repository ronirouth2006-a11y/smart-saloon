from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Configuration
from config import settings

SECRET_KEY = settings.SECRET_KEY 
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="owner/login") # Matches your login route

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# 1. Password Security
def hash_password(password: str):
    # Passlib bcrypt throws an error if the password > 72 chars
    # Let's cleanly slice to 72 and confirm it works
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def verify_password(password, hashed):
    if len(password) > 72:
        password = password[:72]
    return pwd_context.verify(password, hashed)

# 2. Token Generation
def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
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
