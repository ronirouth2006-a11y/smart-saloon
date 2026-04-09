from motor.motor_asyncio import AsyncIOMotorClient
import motor.core
from beanie import init_beanie
from config import settings
import models
import logging

# 🩹 GLOBAL COMPATIBILITY PATCH for Python 3.13 + Beanie 2.1.0 + Motor 3.x
# This fixes the "MotorDatabase object is not callable" or "append_metadata" errors
if not hasattr(motor.core.AgnosticClient, 'append_metadata'):
    motor.core.AgnosticClient.append_metadata = lambda self, x: None

async def init_db():
    try:
        # 🍃 Initialize MongoDB client
        print(f"📡 Connecting to MongoDB Atlas...")
        client = AsyncIOMotorClient(settings.DATABASE_URL, serverSelectionTimeoutMS=5000)
        db = client.get_default_database()
        print(f"📂 Initializing Beanie with models...")
        
        # 📂 Initialize Beanie with the model classes
        await init_beanie(
            database=db,
            document_models=[
                models.User,
                models.Owner,
                models.Saloon,
                models.LiveStatus,
                models.Analytics,
                models.Barber
            ]
        )
        print("✅ MongoDB successfully initialized via Beanie!")
    except Exception as e:
        logging.error(f"❌ Database Initialization Failed: {e}")
        # If it still fails, let's try a direct database access fallback (emergency)
        raise e