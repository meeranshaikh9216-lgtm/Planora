from datetime import datetime, date, timedelta
from flask import Blueprint, request, g
from app.extensions import db
from app.models.planner import StudySession, StudyLog
from app.models.academic import Subject, Topic, TopicProgress
from app.models.reminder import SessionReminder
from app.services.planner_service import PlannerService
from app.services.revision_service import RevisionService
from app.services.gamification_service import GamificationService
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

sessions_bp = Blueprint('sessions', __name__, url_prefix='/api/sessions')

@sessions_bp.route('', methods=['GET'])
@jwt_required
def list_sessions():
    query = StudySession.query.filter_by(user_id=g.user_id)

    # Date filter
    date_str = request.args.get('date')
    if date_str:
        try:
            d = datetime.strptime(date_str, '%Y-%m-%d').date()
            start = datetime(d.year, d.month, d.day, 0, 0, 0)
            end = datetime(d.year, d.month, d.day, 23, 59, 59)
            query = query.filter(StudySession.scheduled_start >= start, StudySession.scheduled_start <= end)
        except ValueError:
            pass

    # Status filter
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    sessions = query.order_by(StudySession.scheduled_start.asc()).all()
    return success_response(data={"sessions": [s.to_dict() for s in sessions]})

@sessions_bp.route('/today', methods=['GET'])
@jwt_required
def get_today_sessions():
    today = date.today()
    start = datetime(today.year, today.month, today.day, 0, 0, 0)
    end = datetime(today.year, today.month, today.day, 23, 59, 59)

    sessions = StudySession.query.filter(
        StudySession.user_id == g.user_id,
        StudySession.scheduled_start >= start,
        StudySession.scheduled_start <= end
    ).order_by(StudySession.scheduled_start.asc()).all()

    return success_response(data={"sessions": [s.to_dict() for s in sessions]})

@sessions_bp.route('/missed', methods=['GET'])
@jwt_required
def get_missed_sessions():
    # Detect newly overdue sessions
    PlannerService.detect_and_handle_missed_sessions(g.user_id)

    missed = StudySession.query.filter_by(
        user_id=g.user_id,
        status='missed'
    ).order_by(StudySession.scheduled_start.desc()).limit(10).all()

    return success_response(data={"missed_sessions": [m.to_dict() for m in missed]})

@sessions_bp.route('/<int:id>/recover', methods=['POST'])
@jwt_required
def recover_missed_session(id):
    data = request.get_json() or {}
    action = data.get('action', 'reschedule') # 'study_now', 'reschedule', 'skip'

    try:
        result = PlannerService.recover_session(id, g.user_id, action)
        return success_response(data=result, message=result.get("message", "Session updated."))
    except ValueError as e:
        return error_response(code="RECOVERY_ERROR", message=str(e), status_code=400)

@sessions_bp.route('', methods=['POST'])
@jwt_required
def create_session():
    data = request.get_json() or {}
    subject_id = data.get('subject_id')
    title = data.get('title', '').strip()
    start_str = data.get('scheduled_start')
    duration = int(data.get('duration_minutes', 60))

    if not subject_id or not start_str or not title:
        return error_response(code="VALIDATION_ERROR", message="Subject, title, and start time are required.")

    try:
        start_time = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
    except Exception:
        return error_response(code="VALIDATION_ERROR", message="Invalid datetime format for scheduled_start.")

    end_time = start_time + timedelta(minutes=duration)

    session = StudySession(
        user_id=g.user_id,
        subject_id=subject_id,
        topic_id=data.get('topic_id'),
        title=title,
        scheduled_start=start_time,
        scheduled_end=end_time,
        duration_minutes=duration,
        status='scheduled',
        notes=data.get('notes')
    )
    db.session.add(session)
    db.session.flush()

    # Automatically provision smart session alarm reminder (default 10m before)
    subj = Subject.query.get(subject_id)
    subj_name = subj.name if subj else None
    topic_name = None
    if data.get('topic_id'):
        top = Topic.query.get(data.get('topic_id'))
        topic_name = top.name if top else None

    minutes_before = int(data.get('reminder_minutes_before', 10))
    reminder = SessionReminder(
        user_id=g.user_id,
        session_id=session.id,
        title=f"Upcoming Study Session: {title}",
        subject_name=subj_name,
        topic_name=topic_name,
        scheduled_start=start_time,
        remind_at=start_time - timedelta(minutes=minutes_before),
        minutes_before=minutes_before,
        sound_enabled=True,
        status='pending'
    )
    db.session.add(reminder)
    db.session.commit()
    return success_response(data={"session": session.to_dict(), "reminder": reminder.to_dict()}, message="Study session scheduled with smart alarm reminder.", status_code=201)

@sessions_bp.route('/<int:id>', methods=['PUT'])
@jwt_required
def update_session(id):
    session = StudySession.query.filter_by(id=id, user_id=g.user_id).first()
    if not session:
        return error_response(code="NOT_FOUND", message="Session not found.", status_code=404)

    data = request.get_json() or {}
    start_changed = False
    if 'title' in data:
        session.title = data['title']
    if 'status' in data:
        session.status = data['status']
        if session.status in ('completed', 'missed'):
            # Dismiss any pending alarms
            for rem in SessionReminder.query.filter_by(session_id=session.id, status='pending').all():
                rem.status = 'dismissed'
    if 'notes' in data:
        session.notes = data['notes']
    if 'duration_minutes' in data:
        session.duration_minutes = int(data['duration_minutes'])
        session.scheduled_end = session.scheduled_start + timedelta(minutes=session.duration_minutes)
    if 'scheduled_start' in data:
        try:
            session.scheduled_start = datetime.fromisoformat(data['scheduled_start'].replace('Z', '+00:00'))
            session.scheduled_end = session.scheduled_start + timedelta(minutes=session.duration_minutes)
            start_changed = True
        except Exception:
            pass

    # Synchronize alarm reminders if time or title changed
    if start_changed or 'title' in data:
        for rem in SessionReminder.query.filter_by(session_id=session.id, status='pending').all():
            rem.title = f"Upcoming Study Session: {session.title}"
            rem.scheduled_start = session.scheduled_start
            rem.remind_at = session.scheduled_start - timedelta(minutes=rem.minutes_before)

    db.session.commit()
    return success_response(data={"session": session.to_dict()}, message="Session updated successfully.")

@sessions_bp.route('/<int:id>/complete', methods=['POST'])
@jwt_required
def complete_session(id):
    session = StudySession.query.filter_by(id=id, user_id=g.user_id).first()
    if not session:
        return error_response(code="NOT_FOUND", message="Session not found.", status_code=404)

    data = request.get_json() or {}
    actual_minutes = int(data.get('actual_minutes', session.duration_minutes))
    focus_rating = int(data.get('focus_rating', 5))
    topics_covered = data.get('topics_covered', session.title)

    session.status = 'completed'

    # Dismiss any remaining pending alarms for this session
    for rem in SessionReminder.query.filter_by(session_id=session.id, status='pending').all():
        rem.status = 'dismissed'

    # Create study log
    study_log = StudyLog(
        user_id=g.user_id,
        session_id=session.id,
        subject_id=session.subject_id,
        topic_id=session.topic_id,
        actual_minutes=actual_minutes,
        focus_rating=focus_rating,
        topics_covered=topics_covered,
        completed_at=datetime.utcnow()
    )
    db.session.add(study_log)

    # Update Topic Progress if session had a topic
    if session.topic_id:
        prog = TopicProgress.query.filter_by(user_id=g.user_id, topic_id=session.topic_id).first()
        if not prog:
            prog = TopicProgress(user_id=g.user_id, topic_id=session.topic_id)
            db.session.add(prog)
        if prog.status == 'not_started':
            prog.status = 'learning'
        prog.last_studied_at = datetime.utcnow()

        # Schedule automated spaced revisions for this topic!
        RevisionService.schedule_initial_revisions(g.user_id, session.topic_id)

    db.session.commit()

    # Award Gamification XP (+20 XP for session completion)
    GamificationService.award_xp(g.user_id, 20, reason="Study Session Completed")

    return success_response(
        data={"session": session.to_dict(), "study_log": study_log.to_dict()},
        message="Session completed! +20 XP awarded and spaced revision scheduled."
    )

@sessions_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required
def delete_session(id):
    session = StudySession.query.filter_by(id=id, user_id=g.user_id).first()
    if not session:
        return error_response(code="NOT_FOUND", message="Session not found.", status_code=404)

    # Delete linked alarms
    SessionReminder.query.filter_by(session_id=session.id).delete()
    db.session.delete(session)
    db.session.commit()
    return success_response(message="Session and its smart alarm deleted.")
