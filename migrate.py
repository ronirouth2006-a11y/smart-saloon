import sqlite3
import os

db_path = "app.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE saloons ADD COLUMN is_approved BOOLEAN DEFAULT 0;")
        print("Added is_approved")
    except Exception as e:
        print("Error or already exists:", e)
        
    try:
        cursor.execute("ALTER TABLE saloons ADD COLUMN storefront_photo_url VARCHAR(255);")
        print("Added storefront_photo_url")
    except Exception as e:
        print("Error or already exists:", e)
        
    # Optional: we can approve existing salons just so the site doesn't empty out for the dev
    cursor.execute("UPDATE saloons SET is_approved = 1;")
    conn.commit()
    conn.close()
    print("Migration complete!")
else:
    print("DB not found, it will be created fresh by SQLAlchemy.")
