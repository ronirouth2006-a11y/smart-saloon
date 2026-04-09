import sqlite3
import os

db_path = "sql_app.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE saloons ADD COLUMN is_rejected BOOLEAN DEFAULT 0;")
        conn.commit()
        print("Successfully added is_rejected column to saloons table.")
    except Exception as e:
        print("Error or already exists:", e)
    finally:
        conn.close()
else:
    print(f"Database {db_path} not found.")

# Also handle test.db if it exists
test_db_path = "test.db"
if os.path.exists(test_db_path):
    conn = sqlite3.connect(test_db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE saloons ADD COLUMN is_rejected BOOLEAN DEFAULT 0;")
        conn.commit()
        print("Successfully added is_rejected column to saloons (test.db).")
    except Exception as e:
        print("Error or already exists in test.db:", e)
    finally:
        conn.close()
