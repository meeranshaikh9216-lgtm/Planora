from datetime import datetime, timedelta
from flask import Blueprint, request, g
from app.extensions import db
from app.models.reminder import SessionReminder
from app.models.planner import StudySession
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

reminders_bp = Blueprint('reminders', __name__, url_prefix='/api/reminders')

@reminders_bp.route('', methods=['GET'])
@jwt_required
def list_reminders():
    """Returns list of student's study alarms & reminders."""
    status = request.args.get('status')
    query = SessionReminder.query.filter_by(user_id=g.user_id)
    if status:
        query = query.filter_by(status=status)

    reminders = query.order_by(SessionReminder.remind_at.asc()).all()
    return success_response(data={"reminders": [r.to_dict() for r in reminders]})


@reminders_bp.route('/due', methods=['GET'])
@jwt_required
def get_due_reminders():
    """
    Returns pending alarms that are due right now (or within the last 10 minutes)
    for active sound chime and browser notification display.
    """
    now = datetime.utcnow()
    window_start = now - timedelta(minutes=15)
    
    # Query pending alarms due up to current time
    due = SessionReminder.query.filter(
        SessionReminder.user_id == g.user_id,
        SessionReminder.status == 'pending',
        SessionReminder.remind_at <= now,
        SessionReminder.remind_at >= window_start
    ).all()

    return success_response(data={"due_reminders": [r.to_dict() for r in due]})


@reminders_bp.route('', methods=['POST'])
@jwt_required
def create_reminder():
    """Creates a new study session alarm/reminder."""
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    session_id = data.get('session_id')
    minutes_before = int(data.get('minutes_before', 10))
    sound_enabled = bool(data.get('sound_enabled', True))

    scheduled_start = None
    subject_name = data.get('subject_name', '')
    topic_name = data.get('topic_name', '')

    if session_id:
        session = StudySession.query.filter_by(id=session_id, user_id=g.user_id).first()
        if session:
            scheduled_start = session.scheduled_start
            subject_name = session.subject.name if session.subject else subject_name
            topic_name = session.topic.name if session.topic else topic_name
            if not title:
                title = f"Study Session: {session.title}"

    if not scheduled_start:
        if data.get('scheduled_start'):
            try:
                scheduled_start = datetime.fromisoformat(data['scheduled_start'].replace('Z', '+00:00'))
            except Exception:
                scheduled_start = datetime.utcnow() + timedelta(hours=1)
        else:
            scheduled_start = datetime.utcnow() + timedelta(hours=1)

    if not title:
        title = "Scheduled Study Focus Block"

    remind_at = scheduled_start - timedelta(minutes=minutes_before)

    reminder = SessionReminder(
        user_id=g.user_id,
        session_id=session_id,
        title=title,
        subject_name=subject_name,
        topic_name=topic_name,
        scheduled_start=scheduled_start,
        remind_at=remind_at,
        minutes_before=minutes_before,
        sound_enabled=sound_enabled,
        status='pending'
    )
    db.session.add(reminder)
    db.session.commit()

    return success_response(
        data={"reminder": reminder.to_dict()},
        message=f"Alarm scheduled for {minutes_before} minutes before session start.",
        status_code=201
    )


@reminders_bp.route('/test', methods=['POST'])
@jwt_required
def test_alarm():
    """
    Creates an immediate test alarm for project demonstration.
    Triggers in 5 seconds to test browser notifications, audio chime, and modal.
    """
    now = datetime.utcnow()
    test_start = now + timedelta(minutes=1)
    # Remind time is right now (5 seconds ago) so it triggers immediately
    remind_time = now - timedelta(seconds=2)

    reminder = SessionReminder(
        user_id=g.user_id,
        session_id=None,
        title="[TEST ALARM] Planora Smart Alarm System",
        subject_name="System Demo",
        topic_name="Audio & Visual Notification Test",
        scheduled_start=test_start,
        remind_at=remind_time,
        minutes_before=0,
        sound_enabled=True,
        status='pending'
    )
    db.session.add(reminder)
    db.session.commit()

    return success_response(
        data={"reminder": reminder.to_dict()},
        message="Test alarm dispatched! Check your browser notification and sound chime.",
        status_code=201
    )


@reminders_bp.route('/<int:id>/dismiss', methods=['POST'])
@jwt_required
def dismiss_reminder(id):
    """Marks an active alarm as delivered and dismissed."""
    reminder = SessionReminder.query.filter_by(id=id, user_id=g.user_id).first()
    if not reminder:
        return error_response(code="NOT_FOUND", message="Alarm not found.", status_code=404)

    reminder.status = 'dismissed'
    reminder.delivered_at = datetime.utcnow()
    db.session.commit()

    return success_response(data={"reminder": reminder.to_dict()}, message="Alarm dismissed.")


@reminders_bp.route('/<int:id>/snooze', methods=['POST'])
@jwt_required
def snooze_reminder(id):
    """Snoozes an alarm by a specified number of minutes (default 5 min)."""
    data = request.get_json() or {}
    snooze_minutes = int(data.get('minutes', 5))

    reminder = SessionReminder.query.filter_by(id=id, user_id=g.user_id).first()
    if not reminder:
        return error_response(code="NOT_FOUND", message="Alarm not found.", status_code=404)

    reminder.remind_at = datetime.utcnow() + timedelta(minutes=snooze_minutes)
    reminder.status = 'pending'
    db.session.commit()

    return success_response(
        data={"reminder": reminder.to_dict()},
        message=f"Alarm snoozed for {snooze_minutes} minutes."
    )


@reminders_bp.route('/sync-sessions', methods=['POST'])
@jwt_required
def sync_session_reminders():
    """
    Scans all upcoming scheduled study sessions for the user and automatically
    generates alarms (10 minutes before) if they don't already exist.
    """
    now = datetime.utcnow()
    upcoming_sessions = StudySession.query.filter(
        StudySession.user_id == g.user_id,
        StudySession.scheduled_start >= now,
        StudySession.status == 'scheduled'
    ).all()

    created_count = 0
    for sess in upcoming_sessions:
        existing = SessionReminder.query.filter_by(session_id=sess.id, user_id=g.user_id).first()
        if not existing:
            remind_at = sess.scheduled_start - timedelta(minutes=10)
            rem = SessionReminder(
                user_id=g.user_id,
                session_id=sess.id,
                title=f"Upcoming: {sess.title}",
                subject_name=sess.subject.name if sess.subject else 'General',
                topic_name=sess.topic.name if sess.topic else 'Study Topic',
                scheduled_start=sess.scheduled_start,
                remind_at=remind_at,
                minutes_before=10,
                sound_enabled=True,
                status='pending'
            )
            db.session.add(rem)
            created_count += 1

    db.session.commit()
    return success_response(
        data={"created_alarms_count": created_count},
        message=f"Synced alarms for {created_count} upcoming study sessions!"
    )
