from flask import Blueprint, request, g
from app.extensions import db
from app.models.notification import FocusSession
from app.services.gamification_service import GamificationService
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

focus_bp = Blueprint('focus', __name__, url_prefix='/api/focus')

@focus_bp.route('/complete', methods=['POST'])
@jwt_required
def complete_focus():
    data = request.get_json() or {}
    duration = int(data.get('duration_minutes', 25))
    actual = int(data.get('actual_minutes', duration))
    breaks = int(data.get('breaks_count', 0))
    subject_id = data.get('subject_id')
    topic_id = data.get('topic_id')

    focus = FocusSession(
        user_id=g.user_id,
        subject_id=subject_id,
        topic_id=topic_id,
        duration_minutes=duration,
        actual_minutes=actual,
        breaks_count=breaks,
        completed=True
    )
    db.session.add(focus)
    db.session.commit()

    # Award XP based on focus minutes (1 XP per minute of deep focus)
    xp_earned = max(10, actual)
    GamificationService.award_xp(g.user_id, xp_earned, reason="Deep Focus Completed")

    return success_response(
        data={"focus_session": focus.to_dict(), "xp_earned": xp_earned},
        message=f"Focus session recorded! +{xp_earned} XP awarded."
    )

@focus_bp.route('/history', methods=['GET'])
@jwt_required
def focus_history():
    sessions = FocusSession.query.filter_by(user_id=g.user_id).order_by(FocusSession.created_at.desc()).limit(20).all()
    return success_response(data={"history": [f.to_dict() for f in sessions]})
