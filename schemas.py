from pydantic import BaseModel
from typing import Optional

class OwnerRegister(BaseModel):
    owner_name: str
    email: str
    password: str
    salon_name: str
    phone: str
    latitude: float
    longitude: float
    password: str

# ১. ওনার লগইন করার জন্য
class OwnerLogin(BaseModel):
    email: str
    password: str

# ২. YOLO ক্যামেরা থেকে ডাটা রিসিভ করার জন্য
class CameraUpdate(BaseModel):
    saloon_id: int
    people: int

# ৩. ✅ NEW: দোকান খোলা বা বন্ধ করার সুইচ এর জন্য
class SalonStatusUpdate(BaseModel):
    is_active: bool

# ৪. ✅ NEW: ইউজার যখন দোকানের লিস্ট দেখবে, তার রেসপন্স ফরম্যাট
class SalonResponse(BaseModel):
    id: int
    name: str
    distance: float
    current_count: int
    status: str
    is_active: bool

    class Config:
        from_attributes = True
