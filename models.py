from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4

class User(Document):
    name: str
    email: Indexed(str, unique=True)
    password: str
    is_customer: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    favorite_salon_ids: List[str] = []

    class Settings:
        name = "users"

class Owner(Document):
    name: str
    email: Indexed(str, unique=True)
    password: str
    phone: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "owners"

class AdminUser(Document):
    email: Indexed(str, unique=True)
    password: str
    role: str = "super_admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "admin_users"

class Saloon(Document):
    owner_id: str  # ID of the Owner document
    name: Indexed(str)
    location: str
    max_limit: int = 8
    assistant_phone: str
    
    # 🌍 Location for map feature
    latitude: float
    longitude: float

    # ✅ Shop Status
    is_active: bool = False
    is_approved: bool = False
    is_rejected: bool = False
    
    storefront_photo_url: Optional[str] = None
    camera_url: Optional[str] = None
    manual_offset: int = 0
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None

    class Settings:
        name = "saloons"

class LiveStatus(Document):
    saloon_id: Indexed(str, unique=True)
    current_count: int = 0
    status: str = "AVAILABLE" # AVAILABLE, MEDIUM, BUSY
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "live_status"

class Analytics(Document):
    saloon_id: Indexed(str)
    total_customers_today: int = 0
    peak_hour: Optional[str] = None
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "analytics"

class Barber(Document):
    saloon_id: Indexed(str)
    name: str
    specialty: str
    is_available: bool = True

    class Settings:
        name = "barbers"