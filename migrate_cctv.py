import sqlite3
import os

db_path = "sql_app.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE saloons ADD COLUMN camera_url VARCHAR(255);")
        conn.commit()
        print("Successfully added camera_url column to saloons table.")
    except Exception as e:
        print("Error or already exists:", e)
    finally:
        conn.close()
else:
    print(f"Database {db_path} not found.")
