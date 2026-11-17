import sys, os
sys.path.insert(0, '.')
from app import create_app
from app.extensions import db

app = create_app()
with app.app_context():
    print("DATABASE URI:", app.config['SQLALCHEMY_DATABASE_URI'])
    metadata_tables = sorted(db.metadata.tables.keys())
    print(f"SQLAlchemy Registered Tables ({len(metadata_tables)}):")
    for t in metadata_tables:
        print(f"  - {t}")
    
    inspector = db.inspect(db.engine)
    physical_tables = sorted(inspector.get_table_names())
    print(f"\nPhysical DB Tables ({len(physical_tables)}):")
    
    for t in physical_tables:
        cnt = db.session.execute(db.text(f'SELECT count(*) FROM "{t}"')).scalar()
        cols = [c['name'] for c in inspector.get_columns(t)]
        pks = inspector.get_pk_constraint(t)['constrained_columns']
        fks = [f"{fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}" for fk in inspector.get_foreign_keys(t)]
        print(f"\nTABLE: {t} (Rows: {cnt})")
        print(f"  PK: {pks}")
        print(f"  Columns ({len(cols)}): {', '.join(cols)}")
        if fks:
            print(f"  FKs: {', '.join(fks)}")
