import sqlite3
import os
import json

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'instance', 'planora.db'))
con = sqlite3.connect(db_path)
con.row_factory = sqlite3.Row
cur = con.cursor()

# 1. Quick integrity check
cur.execute('PRAGMA integrity_check;')
integrity = cur.fetchone()[0]

# 2. Journal mode
cur.execute('PRAGMA journal_mode;')
journal_mode = cur.fetchone()[0]

# 3. Foreign key check
cur.execute('PRAGMA foreign_key_check;')
fk_issues = [list(r) for r in cur.fetchall()]

# 4. Tables and schemas
cur.execute("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name;")
table_rows = cur.fetchall()

analysis = {
    'db_path': db_path,
    'file_size_bytes': os.path.getsize(db_path),
    'file_size_kb': round(os.path.getsize(db_path) / 1024, 2),
    'integrity_check': integrity,
    'journal_mode': journal_mode,
    'foreign_key_issues_count': len(fk_issues),
    'foreign_key_issues': fk_issues,
    'table_count': len(table_rows),
    'tables': {}
}

total_rows = 0
for trow in table_rows:
    tname = trow['name']
    cur.execute(f'SELECT count(*) FROM "{tname}"')
    count = cur.fetchone()[0]
    total_rows += count
    
    cur.execute(f'PRAGMA table_info("{tname}")')
    cols = [{'name': c[1], 'type': c[2], 'notnull': bool(c[3]), 'pk': bool(c[5])} for c in cur.fetchall()]
    
    # Check sample row if available
    sample = None
    if count > 0:
        cur.execute(f'SELECT * FROM "{tname}" LIMIT 1')
        srow = cur.fetchone()
        if srow:
            sample = dict(srow)
            # truncate large strings for clean report
            for k, v in sample.items():
                if isinstance(v, str) and len(v) > 50:
                    sample[k] = v[:47] + '...'
                    
    analysis['tables'][tname] = {
        'row_count': count,
        'column_count': len(cols),
        'columns': [c['name'] for c in cols],
        'pk': [c['name'] for c in cols if c['pk']],
        'sample': sample
    }

analysis['total_rows'] = total_rows

# Print detailed summary
print("=" * 60)
print("PLANORA DATABASE AUDIT & ANALYSIS")
print("=" * 60)
print(f"Path: {analysis['db_path']}")
print(f"Size: {analysis['file_size_kb']} KB")
print(f"Integrity Status: {analysis['integrity_check']}")
print(f"Journal Mode: {analysis['journal_mode']}")
print(f"Foreign Key Anomalies: {analysis['foreign_key_issues_count']}")
print(f"Total Tables: {analysis['table_count']}")
print(f"Total Rows: {analysis['total_rows']}")
print("-" * 60)
print(f"{'Table Name':<28} | {'Rows':<6} | {'Columns':<8} | Primary Key")
print("-" * 60)
for tname, tinfo in sorted(analysis['tables'].items()):
    pk_str = ", ".join(tinfo['pk']) if tinfo['pk'] else "None"
    print(f"{tname:<28} | {tinfo['row_count']:<6} | {tinfo['column_count']:<8} | {pk_str}")
print("=" * 60)

with open(os.path.join(os.path.dirname(__file__), 'db_analysis_report.json'), 'w', encoding='utf-8') as f:
    json.dump(analysis, f, indent=2, default=str)

con.close()
