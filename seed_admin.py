from database import SessionLocal
from models import Saloon, Owner, LiveStatus
from auth import hash_password

def seed_admin_demo():
    db = SessionLocal()
    try:
        # Check if we already have a demo owner
        owner = db.query(Owner).filter(Owner.email == "demo@saloon.com").first()
        if not owner:
            owner = Owner(
                name="Demo Owner",
                email="demo@saloon.com",
                password=hash_password("password123"),
                phone="1234567890"
            )
            db.add(owner)
            db.commit()
            db.refresh(owner)
        
        # Add 2 Pending Salons
        s1 = Saloon(
            owner_id=owner.id,
            name="The Royal Clipper",
            location="Market Street, Block A",
            latitude=22.5800,
            longitude=88.3700,
            is_active=False,
            is_approved=False,
            storefront_photo_url="/static/uploads/salons/demo1.jpg"
        )
        
        s2 = Saloon(
            owner_id=owner.id,
            name="Modern Fades",
            location="Highrise Mall, 2nd Floor",
            latitude=22.5900,
            longitude=88.3800,
            is_active=False,
            is_approved=False
        )
        
        db.add(s1)
        db.add(s2)
        db.commit()
        print("✅ Demo salons added for Admin verification!")
        
    except Exception as e:
        print(f"❌ Seed failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin_demo()
