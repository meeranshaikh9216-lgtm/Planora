import sqlite3
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.auth.security import hash_password

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'instance', 'planora.db'))
con = sqlite3.connect(db_path)
cur = con.cursor()

# 1. Add role column if not exists
cur.execute('PRAGMA table_info(users)')
cols = [c[1] for c in cur.fetchall()]

if 'role' not in cols:
    cur.execute("ALTER TABLE users ADD COLUMN role VARCHAR(30) DEFAULT 'student'")
    con.commit()
    print("Added column `role` to users table.")
else:
    print("`role` column already exists in users table.")

# 2. Ensure existing users have role='student'
cur.execute("UPDATE users SET role = 'student' WHERE role IS NULL OR role = ''")
con.commit()

# 3. Create or update admin account: admin@planora.ai
cur.execute("SELECT id, email, role FROM users WHERE email = 'admin@planora.ai'")
row = cur.fetchone()
if not row:
    pwd_hash = hash_password('Admin@123456')
    cur.execute(
        "INSERT INTO users (name, email, password_hash, xp, streak, role) VALUES (?, ?, ?, ?, ?, ?)",
        ('System Administrator', 'admin@planora.ai', pwd_hash, 100, 1, 'admin')
    )
    con.commit()
    print("Created initial admin account: admin@planora.ai (password: Admin@123456)")
else:
    cur.execute("UPDATE users SET role = 'admin' WHERE email = 'admin@planora.ai'")
    con.commit()
    print("Updated admin@planora.ai to role='admin'.")

con.close()
print("Migration completed successfully.")
