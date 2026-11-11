
import sqlite3

conn = sqlite3.connect("zoom_clone.db")
cursor = conn.cursor()

# Check whether the column already exists
cursor.execute("PRAGMA table_info(participants)")
columns = [column[1] for column in cursor.fetchall()]

if "is_host" not in columns:
    cursor.execute("""
        ALTER TABLE participants
        ADD COLUMN is_host INTEGER NOT NULL DEFAULT 0
    """)

    print("Added is_host column.")

    # Identify the earliest matching host participant
    cursor.execute("""
        UPDATE participants
        SET is_host = 1
        WHERE id IN (
            SELECT MIN(p.id)
            FROM participants p
            JOIN meetings m ON p.meeting_id = m.id
            WHERE p.display_name = m.host_name
            GROUP BY p.meeting_id
        )
    """)

    print("Existing meeting hosts identified.")
else:
    print("is_host column already exists.")

conn.commit()
conn.close()

print("Database migration completed successfully.")
