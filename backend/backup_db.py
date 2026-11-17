"""
Planora Database Backup & Restore Utility
==========================================
Usage:
  python backup_db.py backup      - Create a timestamped backup of planora.db
  python backup_db.py restore     - Restore from the latest backup
  python backup_db.py list        - List all available backups
  python backup_db.py export_sql  - Export all data as SQL INSERT statements
  python backup_db.py stats       - Show database statistics (default)
"""

import os
import sys
import shutil
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'planora.db')
BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database_backups')


def ensure_backup_dir():
    os.makedirs(BACKUP_DIR, exist_ok=True)


def backup():
    ensure_backup_dir()
    if not os.path.exists(DB_PATH):
        print("[ERROR] Database not found at: " + DB_PATH)
        return None

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(BACKUP_DIR, f'planora_backup_{timestamp}.db')

    src = sqlite3.connect(DB_PATH)
    dst = sqlite3.connect(backup_path)
    src.backup(dst)
    dst.close()
    src.close()

    size_kb = os.path.getsize(backup_path) / 1024
    print("[OK] Database backed up successfully!")
    print(f"     Location: {backup_path}")
    print(f"     Size: {size_kb:.1f} KB")
    return backup_path


def list_backups():
    ensure_backup_dir()
    files = sorted([f for f in os.listdir(BACKUP_DIR) if f.endswith('.db')], reverse=True)
    if not files:
        print("[INFO] No backups found.")
        return []
    print(f"Available Backups ({len(files)} total):")
    for i, f in enumerate(files, 1):
        path = os.path.join(BACKUP_DIR, f)
        size_kb = os.path.getsize(path) / 1024
        mtime = datetime.fromtimestamp(os.path.getmtime(path)).strftime('%Y-%m-%d %H:%M:%S')
        print(f"  {i:2d}. {f}  ({size_kb:.1f} KB)  [{mtime}]")
    return files


def restore():
    files = list_backups()
    if not files:
        return

    latest = os.path.join(BACKUP_DIR, files[0])
    print(f"\nRestoring from: {files[0]}")
    confirm = input("Are you sure? This will OVERWRITE your current database. (yes/no): ")
    if confirm.strip().lower() != 'yes':
        print("[CANCELLED] Restore cancelled.")
        return

    if os.path.exists(DB_PATH):
        safety = DB_PATH + '.pre_restore_safety'
        shutil.copy2(DB_PATH, safety)
        print(f"     Safety copy saved to: {safety}")

    src = sqlite3.connect(latest)
    dst = sqlite3.connect(DB_PATH)
    src.backup(dst)
    dst.close()
    src.close()
    print(f"[OK] Database restored successfully from {files[0]}!")


def export_sql():
    if not os.path.exists(DB_PATH):
        print("[ERROR] Database not found at: " + DB_PATH)
        return

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    sql_path = os.path.join(BACKUP_DIR, f'planora_export_{timestamp}.sql')
    ensure_backup_dir()

    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row

    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write("-- Planora Database Export\n")
        f.write(f"-- Generated: {datetime.now().isoformat()}\n")
        f.write(f"-- Database: {DB_PATH}\n\n")

        cur = con.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cur.fetchall()]

        row_total = 0
        for table in tables:
            cur.execute(f'SELECT count(*) FROM "{table}"')
            cnt = cur.fetchone()[0]
            if cnt == 0:
                continue

            f.write(f"-- Table: {table} ({cnt} rows)\n")
            cur.execute(f'SELECT * FROM "{table}"')
            rows = cur.fetchall()

            for row in rows:
                cols = [description[0] for description in cur.description]
                values = []
                for v in row:
                    if v is None:
                        values.append('NULL')
                    elif isinstance(v, (int, float)):
                        values.append(str(v))
                    else:
                        escaped = str(v).replace("'", "''")
                        values.append(f"'{escaped}'")

                f.write(f'INSERT OR REPLACE INTO "{table}" ({", ".join(cols)}) VALUES ({", ".join(values)});\n')
                row_total += 1

            f.write("\n")

    con.close()
    size_kb = os.path.getsize(sql_path) / 1024
    print("[OK] Database exported as SQL!")
    print(f"     File: {sql_path}")
    print(f"     Rows exported: {row_total}")
    print(f"     Size: {size_kb:.1f} KB")
    return sql_path


def show_stats():
    if not os.path.exists(DB_PATH):
        print("[ERROR] Database not found at: " + DB_PATH)
        return

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in cur.fetchall()]

    print("\nPlanora Database Statistics")
    print("=" * 45)
    print(f"Location: {DB_PATH}")
    print(f"Size: {os.path.getsize(DB_PATH)/1024:.1f} KB")
    print(f"\n{'Table':<30} {'Rows':>8}")
    print("-" * 40)

    total = 0
    for t in tables:
        cur.execute(f'SELECT count(*) FROM "{t}"')
        cnt = cur.fetchone()[0]
        total += cnt
        if cnt > 0:
            print(f"{t:<30} {cnt:>8}")

    print("-" * 40)
    print(f"{'TOTAL ROWS':<30} {total:>8}")
    con.close()


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'stats'

    if cmd == 'backup':
        backup()
    elif cmd == 'restore':
        restore()
    elif cmd == 'list':
        list_backups()
    elif cmd == 'export_sql':
        export_sql()
    elif cmd == 'stats':
        show_stats()
    else:
        print(__doc__)
