import motor.motor_asyncio
import asyncio
import models
from config import settings
from beanie import init_beanie

# Compatibility Patch
import motor.core
if not hasattr(motor.core.AgnosticClient, 'append_metadata'):
    motor.core.AgnosticClient.append_metadata = lambda self, x: None

async def cleanup():
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.DATABASE_URL)
    db = client.get_default_database()
    await init_beanie(database=db, document_models=[models.Owner, models.Saloon])
    
    emails = ["hallovai2006@gmail.com", "hellovai2006@gmail.com", "vai2003@gmail.com"]
    for email in emails:
        owner = await models.Owner.find_one(models.Owner.email == email)
        if owner:
            # Check for salon
            salon = await models.Saloon.find_one(models.Saloon.owner_id == str(owner.id))
            if not salon:
                print(f"Partial registration found for {email}. Deleting owner to allow re-registration.")
                await owner.delete()
                print(f"Successfully deleted partial owner: {email}")
            else:
                print(f"Full registration found for {email}. No cleanup needed.")
        else:
            print(f"No owner found for {email}.")

if __name__ == "__main__":
    asyncio.run(cleanup())
