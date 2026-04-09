from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from config import settings
import models

async def init_db():
    # 🍃 Initialize MongoDB client
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    
    # 📂 Initialize Beanie with the model classes
    # We will pass the classes after they are converted to Beanie Documents
    await init_beanie(
        database=client.get_default_database(),
        document_models=[
            models.User,
            models.Owner,
            models.Saloon,
            models.LiveStatus,
            models.Analytics,
            models.Barber
        ]
    )