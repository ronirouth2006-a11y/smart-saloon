from pydantic import BaseModel
from typing import Optional, List

class OwnerRegister(BaseModel):
    owner_name: str
    email: str
    password: str
    salon_name: str
    phone: str
    latitude: float
    longitude: float
    location: str

class CustomerRegister(BaseModel):
    name: str
    email: str
    password: str

class CustomerLogin(BaseModel):
    email: str
    password: str

# 1. For owner login
class OwnerLogin(BaseModel):
    email: str
    password: str

# 2. For receiving data from YOLO camera
class CameraUpdate(BaseModel):
    saloon_id: str  # Updated to str for MongoDB
    people: int

# 3. For shop open/close toggle
class SalonStatusUpdate(BaseModel):
    is_active: bool

# 4. Response format for salon list view
class SalonResponse(BaseModel):
    id: str  # Updated to str for MongoDB
    name: str
    distance: float
    current_count: int
    status: str
    is_active: bool
    camera_url: Optional[str] = None

    class Config:
        from_attributes = True

class BarberCreate(BaseModel):
    name: str
    specialty: str

class BarberResponse(BaseModel):
    id: str  # Updated to str for MongoDB
    name: str
    specialty: str
    is_available: bool

    class Config:
        from_attributes = True

class SalonUpdate(BaseModel):
    name: Optional[str] = None
    max_limit: Optional[int] = None
    assistant_phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    camera_url: Optional[str] = None
    manual_offset: Optional[int] = None
