import pymongo
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

# Setup Hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Load DB URL
load_dotenv()
uri = os.getenv("DATABASE_URL")

if not uri or "mongodb" not in uri:
    print("ERROR: DATABASE_URL not set or not a MongoDB URI!")
    exit(1)

client = pymongo.MongoClient(uri)
db = client.get_default_database()

def seed_admin_demo():
    try:
        # 1. Create Owner
        owner_coll = db["Owner"]
        owner = owner_coll.find_one({"email": "demo@saloon.com"})
        if not owner:
            owner_id = owner_coll.insert_one({
                "name": "Demo Owner",
                "email": "demo@saloon.com",
                "password": hash_password("password123"),
                "phone": "1234567890",
                "is_active": True
            }).inserted_id
            print("SUCCESS: Demo owner created.")
        else:
            owner_id = owner["_id"]
            print("INFO: Demo owner already exists.")

        # 2. Add 2 Pending Salons
        saloon_coll = db["Saloon"]
        saloon_coll.delete_many({"owner_id": str(owner_id)})

        s1 = {
            "owner_id": str(owner_id),
            "name": "The Royal Clipper",
            "location": "Market Street, Block A",
            "latitude": 22.5800,
            "longitude": 88.3700,
            "is_active": False,
            "is_approved": False,
            "is_rejected": False,
            "storefront_photo_url": "/static/uploads/salons/demo1.jpg",
            "assistant_phone": "1234567890",
            "max_limit": 8,
            "manual_offset": 0
        }
        
        s2 = {
            "owner_id": str(owner_id),
            "name": "Modern Fades",
            "location": "Highrise Mall, 2nd Floor",
            "latitude": 22.5900,
            "longitude": 88.3800,
            "is_active": False,
            "is_approved": False,
            "is_rejected": False,
            "assistant_phone": "1234567890",
            "max_limit": 8,
            "manual_offset": 0
        }
        
        res1 = saloon_coll.insert_one(s1)
        res2 = saloon_coll.insert_one(s2)
        
        # 3. Initialize LiveStatus
        status_coll = db["LiveStatus"]
        status_coll.delete_many({"saloon_id": {"$in": [str(res1.inserted_id), str(res2.inserted_id)]}})
        status_coll.insert_many([
            {"saloon_id": str(res1.inserted_id), "current_count": 0, "status": "AVAILABLE"},
            {"saloon_id": str(res2.inserted_id), "current_count": 0, "status": "AVAILABLE"}
        ])

        print("SUCCESS: Demo salons and status records added!")
        
    except Exception as e:
        print(f"FAILED: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    seed_admin_demo()
