import motor.motor_asyncio
import asyncio
import models
from config import settings
from beanie import init_beanie
from datetime import datetime, timezone

# Compatibility Patch
import motor.core
if not hasattr(motor.core.AgnosticClient, 'append_metadata'):
    motor.core.AgnosticClient.append_metadata = lambda self, x: None

async def pulse_check():
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(settings.DATABASE_URL)
        db = client.get_default_database()
        await init_beanie(database=db, document_models=[models.LiveStatus, models.Saloon])
        
        # Target: Modern Fades (from seed)
        target_id = "69d7e446c5ae95b5c5ded656"
        status = await models.LiveStatus.find_one(models.LiveStatus.saloon_id == target_id)
        
        if status:
            old_time = status.updated_at
            status.updated_at = datetime.now(timezone.utc)
            await status.save()
            print(f"Pulse Success! Old: {old_time} -> New: {status.updated_at}")
        else:
            print("Salon status record not found.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(pulse_check())
