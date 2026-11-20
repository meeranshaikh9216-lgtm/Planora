import os
import logging
from flask import Flask, jsonify, send_from_directory, redirect, url_for
from app.config import Config
from app.extensions import db, migrate, cors
from app.routes import register_blueprints
from app.utils.responses import error_response, success_response

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger('planora')

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for frontend
    cors_origins = app.config.get('CORS_ORIGINS', '*')
    if isinstance(cors_origins, str) and ',' in cors_origins:
        cors_origins = [o.strip() for o in cors_origins.split(',')]
    cors.init_app(app, resources={r"/api/*": {"origins": cors_origins}})

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Enable SQLite WAL mode and foreign keys for concurrent DB Browser access
    from sqlalchemy import event
    from sqlalchemy.engine import Engine
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
        except Exception:
            pass

    # Register API Blueprints
    register_blueprints(app)

    # Health check endpoint and SPA static/catch-all route
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist'))

    @app.route('/', defaults={'path': ''}, methods=['GET'])
    @app.route('/<path:path>', methods=['GET'])
    def index(path):
        if path.startswith('api/'):
            return error_response(code="NOT_FOUND", message="The requested API endpoint was not found.", status_code=404)
        
        target_file = os.path.join(frontend_dist, path)
        if path and os.path.exists(target_file):
            return send_from_directory(frontend_dist, path)
        
        index_file = os.path.join(frontend_dist, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(frontend_dist, 'index.html')
        
        return """
        <!DOCTYPE html>
        <html>
        <head><title>Planora AI Study Coach</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1120; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; padding: 40px; border-radius: 16px; text-align: center; border: 1px solid #334155; max-width: 520px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          h1 { color: #6366f1; margin-bottom: 12px; }
          p { color: #94a3b8; font-size: 16px; line-height: 1.5; }
          .badge { display: inline-block; padding: 6px 14px; background: rgba(99, 102, 241, 0.2); color: #818cf8; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 18px; }
          .btn { display: inline-block; margin-top: 24px; padding: 12px 28px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600; transition: background 0.2s; }
          .btn:hover { background: #4f46e5; }
        </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">🚀 Backend Active • Gemini AI Connected</span>
            <h1>Planora API Engine</h1>
            <p>The Python Flask REST API server is healthy and responding to requests.</p>
            <p>To use the full interactive application, open the React Frontend:</p>
            <a class="btn" href="https://planora-frontend-ntar.onrender.com">Open Planora Web App</a>
          </div>
        </body>
        </html>
        """, 200, {'Content-Type': 'text/html'}

    @app.route('/api/health', methods=['GET'])
    def health_check():
        db_status = "connected"
        try:
            db.session.execute(db.text('SELECT 1'))
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"

        return success_response(
            data={
                "status": "healthy",
                "app": "Planora Backend",
                "version": "1.0.0",
                "database": db_status,
                "ai_provider": app.config.get('AI_PROVIDER')
            },
            message="Planora API is running normally."
        )

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        return error_response(code="BAD_REQUEST", message=str(e), status_code=400)

    @app.errorhandler(404)
    def not_found(e):
        return error_response(code="NOT_FOUND", message="The requested resource or endpoint was not found.", status_code=404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error_response(code="METHOD_NOT_ALLOWED", message="HTTP method not allowed for this route.", status_code=405)

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return error_response(code="FILE_TOO_LARGE", message="Uploaded file exceeds 16MB limit.", status_code=413)

    @app.errorhandler(500)
    def internal_server_error(e):
        logger.error(f"Internal server error: {e}", exc_info=True)
        return error_response(code="INTERNAL_SERVER_ERROR", message="An unexpected server error occurred.", status_code=500)

    # Create tables and default achievements on startup
    with app.app_context():
        try:
            db.create_all()
            _init_default_achievements()
        except Exception as e:
            logger.warning(f"Database initialization warning: {e}")

    return app

def _init_default_achievements():
    """Seed base achievements if empty."""
    from app.models.gamification import Achievement
    defaults = [
        ('FIRST_STEP', 'First Step', 'Completed your first study session', 'footprints', 'Rookie Learner', 50),
        ('QUIZ_MASTER', 'Quiz Master', 'Scored 100% on any subject quiz', 'award', 'Perfectionist', 100),
        ('STREAK_3', 'Consistency Spark', 'Maintained a 3-day study streak', 'flame', 'Dedicated', 75),
        ('STREAK_7', 'Unstoppable Momentum', 'Maintained a 7-day study streak', 'zap', 'Scholar', 200),
        ('NIGHT_OWL', 'Deep Focus', 'Completed a focus session of over 45 minutes', 'clock', 'Deep Diver', 60),
        ('REVISION_HERO', 'Memory Champion', 'Completed 5 scheduled spaced revisions', 'repeat', 'Retention Guru', 150),
        ('DOUBT_CRUSHER', 'Curious Mind', 'Asked AI Tutor questions or doubts', 'sparkles', 'Inquisitive', 80)
    ]
    for code, title, desc, icon, badge, xp in defaults:
        if not Achievement.query.filter_by(code=code).first():
            ach = Achievement(code=code, title=title, description=desc, icon=icon, badge_name=badge, xp_reward=xp)
            db.session.add(ach)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
