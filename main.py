from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
import pytz
import os

from database import Base, engine, SessionLocal
from routers.camera import router as camera_router
from routers.public import router as public_router
from routers.owner import router as owner_router
from routers.customer import router as customer_router
from routers.admin import router as admin_router
from routers.auth_routes import router as auth_router
from models import LiveStatus, Saloon

# 🛠️ Database Table Initialization
# Automatically create necessary tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Saloon Crowd System")

# 🌐 CORS Configuration
# Allows your frontend (e.g., port 3000/5173) to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Important for local development
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
app.include_router(camera_router)
app.include_router(public_router)
app.include_router(owner_router)
app.include_router(customer_router)
app.include_router(admin_router)
app.include_router(auth_router)

# Ensure uploads directory exists and mount it
os.makedirs("static/uploads/salons", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ⏰ Auto-Close Background Job (Midnight IST)
def close_all_salons_at_midnight():
    db = SessionLocal()
    try:
        # Set all active salons to offline
        db.query(Saloon).filter(Saloon.is_active == True).update({"is_active": False})
        # Reset all live bounds to 0
        db.query(LiveStatus).update({"current_count": 0, "status": "AVAILABLE"})
        db.commit()
        print("🔔 Midnight CRON: All salons automatically closed and crowd counts reset.")
    except Exception as e:
        print(f"Error running midnight CRON: {e}")
    finally:
        db.close()

scheduler = BackgroundScheduler()
# Run at 11:59 PM everyday in IST
scheduler.add_job(close_all_salons_at_midnight, 'cron', hour=23, minute=59, timezone=pytz.timezone('Asia/Kolkata'))
scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()

@app.get("/")
def home():
    return {"message": "Saloon Crowd Monitoring API running"}

# 📊 Live Data Endpoint (Update with IST)
@app.get("/debug-db")
def debug_db(db: Session = Depends(get_db)):
    # JOIN query to fetch live counts along with salon names and coordinates
    results = db.query(
        LiveStatus, 
        Saloon.name, 
        Saloon.latitude, 
        Saloon.longitude
    ).join(Saloon, LiveStatus.saloon_id == Saloon.id).all()
    
    # Set Indian Standard Time (IST) timezone
    ist_timezone = pytz.timezone('Asia/Kolkata')
    
    formatted_data = []

    for status, name, lat, lon in results:
        # Convert database UTC time to IST
        ist_time = status.updated_at.astimezone(ist_timezone)
        
        formatted_data.append({
            "salon_name": name,             # e.g., "banarjeesaloon"
            "current_count": status.current_count, # Live count from AI camera
            "latitude": lat,                
            "longitude": lon,               
            # 12-hour format (e.g., 06:08:08 AM)
            "updated_at": ist_time.strftime("%I:%M:%S %p") + " (IST)" 
        })
        
    return formatted_data