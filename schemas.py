from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List

class OwnerRegister(BaseModel):
    owner_name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    salon_name: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=1)
    latitude: float
    longitude: float
    location: str = Field(..., min_length=1)

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

class AdminLogin(BaseModel):
    email: str
    password: str

# 2. For receiving data from YOLO camera
class CameraUpdate(BaseModel):
    saloon_id: str  # Updated to str for MongoDB
    people: int = Field(..., ge=0)

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

    model_config = ConfigDict(from_attributes=True)

class BarberCreate(BaseModel):
    name: str
    specialty: str

class BarberResponse(BaseModel):
    id: str  # Updated to str for MongoDB
    name: str
    specialty: str
    is_available: bool

    model_config = ConfigDict(from_attributes=True)

class SalonUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    max_limit: Optional[int] = Field(None, gt=0)
    assistant_phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    camera_url: Optional[str] = None
    manual_offset: Optional[int] = None
