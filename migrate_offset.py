import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('sql_app.db')
        cursor = conn.cursor()
        cursor.execute("ALTER TABLE saloons ADD COLUMN manual_offset INTEGER DEFAULT 0;")
        conn.commit()
        print("Successfully added manual_offset column to saloons table!")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column manual_offset already exists. Skipping Migration.")
        else:
            print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
