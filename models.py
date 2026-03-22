from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Boolean
from database import Base
from datetime import datetime

class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    email = Column(String(100), unique=True)
    password = Column(String(200))
    phone = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)

class Saloon(Base):
    __tablename__ = "saloons"

    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("owners.id"))
    name = Column(String(100))
    location = Column(String(200))
    max_limit = Column(Integer, default=8)
    assistant_phone = Column(String(20))

    # 🌍 Location for map feature
    latitude = Column(Float)
    longitude = Column(Float)

    # ✅ NEW: Shop Status (Startup-এর জন্য মাস্ট)
    # মালিক লগইন করে দোকান ওপেন করলে এটা True হবে, না হলে False
    is_active = Column(Boolean, default=False)

class LiveStatus(Base):
    __tablename__ = "live_status"

    id = Column(Integer, primary_key=True)
    saloon_id = Column(Integer, ForeignKey("saloons.id"))
    current_count = Column(Integer)
    status = Column(String(20)) # Green, Orange, Red
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Analytics(Base):
    __tablename__ = "analytics"
    id = Column(Integer, primary_key=True)
    saloon_id = Column(Integer, ForeignKey("saloons.id"))
    total_customers_today = Column(Integer, default=0)
    peak_hour = Column(String(50)) # কোন সময় ভিড় বেশি ছিল
    date = Column(DateTime, default=datetime.utcnow)