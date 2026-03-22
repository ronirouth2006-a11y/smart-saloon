from fastapi import FastAPI, Depends
from database import Base, engine, SessionLocal
# সরাসরি রাউটার অবজেক্টগুলো ইমপোর্ট করা হচ্ছে যাতে পাথ ভুল না হয়
from routers.camera import router as camera_router
from routers.public import router as public_router
from routers.owner import router as owner_router
from models import LiveStatus, Saloon
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pytz

# 🛠️ Database Table Initialization
# PostgreSQL এ প্রয়োজনীয় টেবিলগুলো স্বয়ংক্রিয়ভাবে তৈরি করবে
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Saloon Crowd System")

# 🌐 CORS Configuration
# এটি আপনার ফ্রন্টএন্ড (পোর্ট ৫৫০০) থেকে ব্যাকএন্ডে ডাটা পাঠানোর অনুমতি দেয়
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # লোকাল ডেভেলপমেন্টের জন্য এটি জরুরি
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔌 Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 🚀 Router Registration
# owner_router এর ভেতরে prefix="/owner" দেওয়া আছে, তাই এখানে আলাদা প্রিফিক্স লাগবে না
app.include_router(camera_router)
app.include_router(public_router)
app.include_router(owner_router)

@app.get("/")
def home():
    return {"message": "Saloon Crowd Monitoring API running"}

# 📊 Live Data Endpoint (A-Z Update with IST)
@app.get("/debug-db")
def debug_db(db: Session = Depends(get_db)):
    # লাইভ কাউন্ট এবং সেলুনের নাম একসাথে পাওয়ার জন্য JOIN কুয়েরি
    results = db.query(
        LiveStatus, 
        Saloon.name, 
        Saloon.latitude, 
        Saloon.longitude
    ).join(Saloon, LiveStatus.saloon_id == Saloon.id).all()
    
    # ইন্ডিয়ান টাইমজোন সেট করা
    ist_timezone = pytz.timezone('Asia/Kolkata')
    
    formatted_data = []

    for status, name, lat, lon in results:
        # ডাটাবেসের UTC সময়কে IST সময়ে রূপান্তর
        ist_time = status.updated_at.astimezone(ist_timezone)
        
        formatted_data.append({
            "salon_name": name,             # যেমন: "banarjeesaloon"
            "current_count": status.current_count, # AI ক্যামেরা থেকে আসা লাইভ সংখ্যা
            "latitude": lat,                
            "longitude": lon,               
            # ১২ ঘণ্টার ফরম্যাট (যেমন: 06:08:08 AM)
            "updated_at": ist_time.strftime("%I:%M:%S %p") + " (IST)" 
        })
        
    return formatted_data