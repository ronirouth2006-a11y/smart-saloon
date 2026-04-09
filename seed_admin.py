import asyncio
from database import init_db
import models
from auth import hash_password

async def seed_admin_demo():
    # 🔌 Initialize Beanie
    await init_db()
    
    try:
        # Check if we already have a demo owner
        owner = await models.Owner.find_one(models.Owner.email == "demo@saloon.com")
        if not owner:
            owner = models.Owner(
                name="Demo Owner",
                email="demo@saloon.com",
                password=hash_password("password123"),
                phone="1234567890"
            )
            await owner.insert()
        
        # Add 2 Pending Salons
        s1 = models.Saloon(
            owner_id=str(owner.id),
            name="The Royal Clipper",
            location="Market Street, Block A",
            latitude=22.5800,
            longitude=88.3700,
            is_active=False,
            is_approved=False,
            storefront_photo_url="/static/uploads/salons/demo1.jpg",
            assistant_phone="1234567890"
        )
        
        s2 = models.Saloon(
            owner_id=str(owner.id),
            name="Modern Fades",
            location="Highrise Mall, 2nd Floor",
            latitude=22.5900,
            longitude=88.3800,
            is_active=False,
            is_approved=False,
            assistant_phone="1234567890"
        )
        
        await s1.insert()
        await s2.insert()
        print("✅ Demo salons added for Admin verification!")
        
    except Exception as e:
        print(f"❌ Seed failed: {e}")

if __name__ == "__main__":
    asyncio.run(seed_admin_demo())
