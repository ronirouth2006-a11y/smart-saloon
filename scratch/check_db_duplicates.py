import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import models
from config import settings

async def check_db():
    print("Connecting to DB...")
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client.get_default_database()
    
    await init_beanie(
        database=db,
        document_models=[models.User, models.Owner, models.Saloon, models.LiveStatus, models.Analytics, models.Barber]
    )
    
    # Check for the salon and owner
    owner_count = await models.Owner.count()
    salon_count = await models.Saloon.count()
    
    print(f"Database Stats: {owner_count} Owners, {salon_count} Salons")
    
    salon_names = await models.Saloon.find_all().to_list()
    print("Current Salons:")
    for s in salon_names:
        print(f"- {s.name} (Approved: {s.is_approved})")
    
    # Check for duplicates specifically
    target_email = "soumajit22@gmail.com"
    target_salon = "hey saloon"
    
    existing_owner = await models.Owner.find_one(models.Owner.email == target_email)
    existing_salon = await models.Saloon.find_one({"name": {"$regex": f"^{target_salon}$", "$options": "i"}})
    
    if existing_owner: print(f"Owner with email '{target_email}' already exists!")
    if existing_salon: print(f"Salon with name '{target_salon}' already exists!")

if __name__ == "__main__":
    import motor.core
    if not hasattr(motor.core.AgnosticClient, 'append_metadata'):
        motor.core.AgnosticClient.append_metadata = lambda self, x: None
    asyncio.run(check_db())
