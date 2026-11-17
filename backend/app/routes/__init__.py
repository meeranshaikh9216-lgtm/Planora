from app.routes.auth import auth_bp
from app.routes.profile import profile_bp
from app.routes.subjects import subjects_bp, topics_bp
from app.routes.planners import planners_bp
from app.routes.sessions import sessions_bp
from app.routes.study import study_bp
from app.routes.ai import ai_bp
from app.routes.quizzes import quizzes_bp
from app.routes.revisions import revisions_bp
from app.routes.mistakes import mistakes_bp
from app.routes.notes import notes_bp
from app.routes.flashcards import flashcards_bp
from app.routes.progress import progress_bp
from app.routes.focus import focus_bp
from app.routes.documents import documents_bp
from app.routes.notifications import notifications_bp
from app.routes.db_explorer import db_explorer_bp
from app.routes.reminders import reminders_bp
from app.routes.intelligence import intelligence_bp
from app.routes.practicals import practicals_bp
from app.routes.assignments import assignments_bp
from app.routes.admin import admin_bp

def register_blueprints(app):
    """Register all REST API blueprints on the Flask app."""
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(subjects_bp)
    app.register_blueprint(topics_bp)
    app.register_blueprint(planners_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(study_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(quizzes_bp)
    app.register_blueprint(revisions_bp)
    app.register_blueprint(mistakes_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(flashcards_bp)
    app.register_blueprint(progress_bp)
    app.register_blueprint(focus_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(db_explorer_bp)
    app.register_blueprint(reminders_bp)
    app.register_blueprint(intelligence_bp)
    app.register_blueprint(practicals_bp)
    app.register_blueprint(assignments_bp)
    app.register_blueprint(admin_bp)
