import asyncio
from database import init_db
import models
from auth import hash_password

async def seed_super_admin():
    # 🔌 Initialize Beanie
    await init_db()
    
    try:
        # Check if we already have a super admin
        admin = await models.AdminUser.find_one(models.AdminUser.email == "superadmin@saloon.com")
        if not admin:
            admin = models.AdminUser(
                email="superadmin@saloon.com",
                password=hash_password("admin123"),
                role="super_admin"
            )
            await admin.insert()
            print("✅ Super Admin created: superadmin@saloon.com / admin123")
        else:
            print("⚡ Super Admin already exists!")
            
    except Exception as e:
        print(f"❌ Seed failed: {e}")

if __name__ == "__main__":
    asyncio.run(seed_super_admin())
