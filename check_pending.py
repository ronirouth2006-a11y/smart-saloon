import motor.motor_asyncio
import asyncio
import models
from config import settings
from beanie import init_beanie

# Compatibility Patch
import motor.core
if not hasattr(motor.core.AgnosticClient, 'append_metadata'):
    motor.core.AgnosticClient.append_metadata = lambda self, x: None

async def check():
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(settings.DATABASE_URL)
        db = client.get_default_database()
        
        await init_beanie(database=db, document_models=[models.Owner, models.Saloon])
        
        print(f"--- All Owners ---")
        owners = await models.Owner.find().to_list()
        for o in owners:
            print(f"Owner ID: {o.id}, Email: {o.email}, Name: {o.name}")
            
        print(f"--- All Salons ---")
        salons = await models.Saloon.find().to_list()
        for s in salons:
            print(f"Salon ID: {s.id}, Name: {s.name}, OwnerID Ref: {s.owner_id}")
        
        target_email = "hallovai2006@gmail.com"
        owner = await models.Owner.find_one(models.Owner.email == target_email)
        if owner:
            print(f"\nTarget Owner found: {owner.id}")
            # Try finding salon by string owner_id AND potentially other matches
            s = await models.Saloon.find_one(models.Saloon.owner_id == str(owner.id))
            if s:
                print(f"SUCCESS: Salon {s.name} found for this owner ID!")
            else:
                print(f"CRITICAL: No salon found for owner ID {owner.id}")
                # Check for salon with name 'vai vai saloon'
                s_by_name = await models.Saloon.find_one(models.Saloon.name == "vai vai saloon")
                if s_by_name:
                    print(f"WARNING: Salon 'vai vai saloon' found but has different OwnerID: {s_by_name.owner_id}")
        else:
            print(f"\nINFO: Owner {target_email} NOT found.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())

