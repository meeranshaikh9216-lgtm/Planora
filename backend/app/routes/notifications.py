from flask import Blueprint, request, g
from app.extensions import db
from app.models.notification import Notification
from app.models.gamification import Achievement, UserAchievement
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api')

@notifications_bp.route('/notifications', methods=['GET'])
@jwt_required
def list_notifications():
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    query = Notification.query.filter_by(user_id=g.user_id)
    if unread_only:
        query = query.filter_by(is_read=False)

    notifs = query.order_by(Notification.created_at.desc()).limit(30).all()
    unread_count = Notification.query.filter_by(user_id=g.user_id, is_read=False).count()

    return success_response(data={"notifications": [n.to_dict() for n in notifs], "unread_count": unread_count})

@notifications_bp.route('/notifications/<int:id>/read', methods=['PUT'])
@jwt_required
def mark_read(id):
    notif = Notification.query.filter_by(id=id, user_id=g.user_id).first()
    if not notif:
        return error_response(code="NOT_FOUND", message="Notification not found.", status_code=404)

    notif.is_read = True
    db.session.commit()
    return success_response(data={"notification": notif.to_dict()}, message="Notification marked as read.")

@notifications_bp.route('/notifications/read-all', methods=['PUT'])
@jwt_required
def mark_all_read():
    Notification.query.filter_by(user_id=g.user_id, is_read=False).update({"is_read": True})
    db.session.commit()
    return success_response(message="All notifications marked as read.")

@notifications_bp.route('/achievements', methods=['GET'])
@jwt_required
def list_achievements():
    all_achievements = Achievement.query.all()
    user_unlocked = {
        ua.achievement_id: ua.unlocked_at.isoformat()
        for ua in UserAchievement.query.filter_by(user_id=g.user_id).all()
    }

    result = []
    for a in all_achievements:
        item = a.to_dict()
        item['unlocked'] = a.id in user_unlocked
        item['unlocked_at'] = user_unlocked.get(a.id)
        result.append(item)

    return success_response(data={"achievements": result})
