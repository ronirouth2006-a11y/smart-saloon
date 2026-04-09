from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager
import pytz
import os

from database import init_db
from routers.camera import router as camera_router
from routers.public import router as public_router
from routers.owner import router as owner_router
from routers.customer import router as customer_router
from routers.admin import router as admin_router
from routers.auth_routes import router as auth_router
from models import LiveStatus, Saloon

# ⏰ Auto-Close Background Job (Midnight IST)
async def close_all_salons_at_midnight():
    try:
        # Set all active salons to offline
        await Saloon.find(Saloon.is_active == True).update({"$set": {"is_active": False}})
        # Reset all live bounds to 0
        await LiveStatus.find_all().update({"$set": {"current_count": 0, "status": "AVAILABLE"}})
        print("🔔 Midnight CRON: All salons automatically closed and crowd counts reset.")
    except Exception as e:
        print(f"Error running midnight CRON: {e}")

# 🚀 Lifespan Event for Database & Scheduler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize MongoDB (Beanie)
    await init_db()
    
    # 2. Setup Background Scheduler (Async version)
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        close_all_salons_at_midnight, 
        'cron', 
        hour=23, 
        minute=59, 
        timezone=pytz.timezone('Asia/Kolkata')
    )
    scheduler.start()
    
    yield
    
    # 3. Shutdown
    if scheduler.running:
        scheduler.shutdown()

app = FastAPI(title="Smart Saloon Crowd System (MongoDB)", lifespan=lifespan)

# 🌐 CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
def home():
    return {"message": "Saloon Crowd Monitoring API (MongoDB) running"}

# 📊 Live Data Endpoint (Debug Only)
@app.get("/debug-db")
async def debug_db():
    ist_timezone = pytz.timezone('Asia/Kolkata')
    results = await LiveStatus.find_all().to_list()
    
    formatted_data = []
    for status in results:
        # Fetch related salon name from its separate document
        salon = await Saloon.get(status.saloon_id)
        if not salon: continue
        
        ist_time = status.updated_at.astimezone(ist_timezone)
        formatted_data.append({
            "salon_name": salon.name,
            "current_count": status.current_count,
            "latitude": salon.latitude,
            "longitude": salon.longitude,
            "updated_at": ist_time.strftime("%I:%M:%S %p") + " (IST)" 
        })
        
    return formatted_data