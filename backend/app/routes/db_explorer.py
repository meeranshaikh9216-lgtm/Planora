import os
from flask import Blueprint, request, g
from app.extensions import db
from app.auth.security import admin_required
from app.utils.responses import success_response, error_response

db_explorer_bp = Blueprint('db_explorer', __name__, url_prefix='/api/admin/database')

@db_explorer_bp.route('/overview', methods=['GET'])
@admin_required
def get_database_overview():
    """
    Returns complete database schema overview:
    - All registered tables
    - Total row counts
    - Column metadata (name, type, nullable, primary key)
    - Foreign keys and relationships
    """
    try:
        inspector = db.inspect(db.engine)
        table_names = sorted(inspector.get_table_names())
        tables_data = []

        total_rows = 0
        for tname in table_names:
            try:
                cnt = db.session.execute(db.text(f'SELECT count(*) FROM "{tname}"')).scalar() or 0
            except Exception:
                cnt = 0
            total_rows += cnt

            cols = inspector.get_columns(tname)
            pk = inspector.get_pk_constraint(tname).get('constrained_columns', [])
            fks = inspector.get_foreign_keys(tname)

            columns_info = [
                {
                    'name': c['name'],
                    'type': str(c['type']),
                    'nullable': c.get('nullable', True),
                    'is_primary_key': c['name'] in pk
                }
                for c in cols
            ]

            foreign_keys_info = [
                {
                    'columns': fk.get('constrained_columns', []),
                    'referred_table': fk.get('referred_table'),
                    'referred_columns': fk.get('referred_columns', [])
                }
                for fk in fks
            ]

            tables_data.append({
                'table_name': tname,
                'row_count': cnt,
                'columns_count': len(columns_info),
                'primary_key': pk,
                'columns': columns_info,
                'foreign_keys': foreign_keys_info
            })

        db_path = str(db.engine.url)
        file_size_kb = 0
        if 'sqlite' in db_path:
            clean_path = db.engine.url.database
            if clean_path and os.path.exists(clean_path):
                file_size_kb = round(os.path.getsize(clean_path) / 1024, 2)

        return success_response(data={
            'database_engine': db.engine.name,
            'database_uri_type': 'SQLite (WAL mode)' if 'sqlite' in db_path else 'MySQL 8.0',
            'file_size_kb': file_size_kb,
            'total_tables': len(tables_data),
            'total_rows': total_rows,
            'tables': tables_data
        })
    except Exception as e:
        return error_response(code="DB_EXPLORER_ERROR", message=f"Failed to inspect database: {str(e)}", status_code=500)


@db_explorer_bp.route('/table/<table_name>', methods=['GET'])
@admin_required
def get_table_records(table_name):
    """
    Returns paginated records for a specific table with search and sorting.
    Safe against SQL injection (table and column names validated against inspector).
    """
    try:
        inspector = db.inspect(db.engine)
        valid_tables = inspector.get_table_names()

        if table_name not in valid_tables:
            return error_response(code="NOT_FOUND", message=f"Table '{table_name}' does not exist in database.", status_code=404)

        columns = [c['name'] for c in inspector.get_columns(table_name)]
        page = max(1, int(request.args.get('page', 1)))
        per_page = min(100, max(5, int(request.args.get('per_page', 15))))
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'id')
        sort_order = request.args.get('sort_order', 'desc').lower()

        if sort_by not in columns:
            sort_by = columns[0] if columns else 'id'
        if sort_order not in ['asc', 'desc']:
            sort_order = 'desc'

        # Build safe query
        where_clauses = []
        params = {}
        if search:
            # Search across string/text columns
            search_conditions = []
            for i, col in enumerate(columns[:6]): # Limit search across top 6 columns
                param_key = f"s_{i}"
                search_conditions.append(f'CAST("{col}" AS TEXT) LIKE :{param_key}')
                params[param_key] = f"%{search}%"
            if search_conditions:
                where_clauses.append(f"({' OR '.join(search_conditions)})")

        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

        # Total matching rows
        count_query = db.text(f'SELECT count(*) FROM "{table_name}" {where_sql}')
        total_count = db.session.execute(count_query, params).scalar() or 0

        # Query paginated rows
        offset = (page - 1) * per_page
        query_sql = f'SELECT * FROM "{table_name}" {where_sql} ORDER BY "{sort_by}" {sort_order} LIMIT :limit OFFSET :offset'
        params['limit'] = per_page
        params['offset'] = offset

        result = db.session.execute(db.text(query_sql), params)
        records = []
        for row in result:
            record_dict = {}
            for k, v in row._mapping.items():
                if k == 'password_hash':
                    record_dict[k] = '[PROTECTED_HASH]'
                elif hasattr(v, 'isoformat'):
                    record_dict[k] = v.isoformat()
                else:
                    record_dict[k] = v
            records.append(record_dict)

        total_pages = max(1, (total_count + per_page - 1) // per_page)

        return success_response(data={
            'table_name': table_name,
            'columns': columns,
            'records': records,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        })
    except Exception as e:
        return error_response(code="DB_QUERY_ERROR", message=f"Failed to query table: {str(e)}", status_code=500)
