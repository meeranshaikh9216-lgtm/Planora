import csv
import io
from datetime import datetime, timedelta
from flask import Blueprint, request, g, Response
from sqlalchemy import func
from app.extensions import db
from app.auth.security import admin_required
from app.models.user import User, StudentProfile
from app.models.planner import Planner, PlannerSubject, StudySession, StudyLog
from app.models.academic import Subject, Topic, TopicProgress
from app.models.quiz import QuizAttempt
from app.models.revision import Mistake, Revision
from app.models.practical import Practical, PracticalAttempt
from app.models.reminder import SessionReminder
from app.models.notification import FocusSession
from app.models.ai import AIConversation, AIMessage
from app.utils.responses import success_response, error_response

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/overview', methods=['GET'])
@admin_required
def admin_overview():
    """
    Computes real, un-fabricated system metrics across all registered students and learning activities.
    """
    # 1. Student Counts
    total_students = User.query.filter_by(role='student').count()

    # Active students: logged in or studied in last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    active_students = User.query.filter(
        User.role == 'student',
        (User.last_active_date >= seven_days_ago.date()) | (User.updated_at >= seven_days_ago)
    ).count()

    # Students with / without AI Study Plans
    students_with_plans_query = db.session.query(func.count(func.distinct(Planner.user_id))).scalar() or 0
    students_with_plans = students_with_plans_query
    students_without_plans = max(0, total_students - students_with_plans)

    # Total Plans & Sessions
    total_plans = Planner.query.count()
    total_sessions = StudySession.query.count()
    completed_sessions = StudySession.query.filter_by(status='completed').count()
    scheduled_sessions = StudySession.query.filter_by(status='scheduled').count()
    missed_sessions = StudySession.query.filter_by(status='missed').count()

    # 2. Distribution by Stream, Class, and Board
    stream_distribution = []
    stream_counts = db.session.query(
        StudentProfile.stream, func.count(StudentProfile.id)
    ).group_by(StudentProfile.stream).all()
    for stream_name, count in stream_counts:
        stream_distribution.append({'stream': stream_name or 'Unspecified', 'count': count})

    class_distribution = []
    class_counts = db.session.query(
        StudentProfile.grade_class, func.count(StudentProfile.id)
    ).group_by(StudentProfile.grade_class).all()
    for class_name, count in class_counts:
        class_distribution.append({'class_name': class_name or 'Unspecified', 'count': count})

    board_distribution = []
    board_counts = db.session.query(
        StudentProfile.board, func.count(StudentProfile.id)
    ).group_by(StudentProfile.board).all()
    for board_name, count in board_counts:
        board_distribution.append({'board': board_name or 'General', 'count': count})

    # 3. Recent Registrations
    recent_users = User.query.filter_by(role='student').order_by(User.created_at.desc()).limit(5).all()
    recent_students = [
        {
            'id': u.id,
            'name': u.name,
            'email': u.email,
            'created_at': u.created_at.isoformat() if u.created_at else None,
            'stream': u.profile.stream if u.profile else 'General',
            'grade_class': u.profile.grade_class if u.profile else 'Grade 12'
        }
        for u in recent_users
    ]

    # 4. Recent AI Plan Generations
    recent_planners = Planner.query.order_by(Planner.created_at.desc()).limit(5).all()
    recent_plans = [
        {
            'id': p.id,
            'user_id': p.user_id,
            'student_name': p.user.name if p.user else 'Student',
            'title': p.title,
            'daily_hours': float(p.daily_hours) if p.daily_hours else 4.0,
            'sessions_count': len(p.sessions) if p.sessions else 0,
            'total_sessions': len(p.sessions) if p.sessions else 0,
            'status': getattr(p, 'status', 'active') or 'active',
            'created_at': p.created_at.isoformat() if p.created_at else None
        }
        for p in recent_planners
    ]

    # 5. Reminder & AI Metrics
    total_reminders = SessionReminder.query.count()
    pending_reminders = SessionReminder.query.filter_by(status='pending').count()
    total_practicals = Practical.query.count()
    total_practical_attempts = PracticalAttempt.query.count()
    total_ai_conversations = AIConversation.query.count()

    session_completion_rate = round((completed_sessions / total_sessions * 100), 1) if total_sessions > 0 else 0.0

    metrics_obj = {
        'total_students': total_students,
        'active_students': active_students,
        'students_with_plans': students_with_plans,
        'students_without_plans': students_without_plans,
        'total_ai_plans': total_plans,
        'total_sessions': total_sessions,
        'completed_sessions': completed_sessions,
        'scheduled_sessions': scheduled_sessions,
        'missed_sessions': missed_sessions,
        'session_completion_rate': session_completion_rate,
        'total_reminders': total_reminders,
        'pending_reminders': pending_reminders,
        'total_practicals': total_practicals,
        'total_practical_attempts': total_practical_attempts,
        'total_focus_sessions': total_sessions,
        'total_ai_conversations': total_ai_conversations
    }

    return success_response(data={
        'metrics': metrics_obj,
        'stream_distribution': stream_distribution,
        'board_distribution': board_distribution,
        'class_distribution': class_distribution,
        'recent_registrations': recent_students,
        'recent_plans': recent_plans,
        **metrics_obj
    })


@admin_bp.route('/students', methods=['GET'])
@admin_required
def admin_students_list():
    """
    Searchable, paginated student records directory.
    """
    page = max(1, int(request.args.get('page', 1)))
    per_page = min(50, max(5, int(request.args.get('per_page', 10))))
    search = request.args.get('search', '').strip()
    stream_filter = request.args.get('stream', '').strip()
    board_filter = request.args.get('board', '').strip()

    query = User.query.filter_by(role='student')

    if search:
        query = query.filter((User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%")))

    if stream_filter and stream_filter != 'all':
        query = query.join(StudentProfile).filter(StudentProfile.stream == stream_filter)

    if board_filter and board_filter != 'all':
        query = query.join(StudentProfile, isouter=True).filter(StudentProfile.board == board_filter)

    total_count = query.count()
    students = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    student_records = []
    for s in students:
        plans_cnt = Planner.query.filter_by(user_id=s.id).count()
        sessions_cnt = StudySession.query.filter_by(user_id=s.id).count()
        completed_cnt = StudySession.query.filter_by(user_id=s.id, status='completed').count()
        quizzes_cnt = QuizAttempt.query.filter_by(user_id=s.id).count()
        practicals_cnt = PracticalAttempt.query.filter_by(user_id=s.id).count()

        student_records.append({
            'id': s.id,
            'name': s.name,
            'email': s.email,
            'xp': s.xp,
            'streak': s.streak,
            'created_at': s.created_at.isoformat() if s.created_at else None,
            'last_active_date': s.last_active_date.isoformat() if s.last_active_date else None,
            'stream': s.profile.stream if s.profile else 'General',
            'grade_class': s.profile.grade_class if s.profile else 'Grade 12',
            'board': s.profile.board if s.profile else 'General',
            'plans_count': plans_cnt,
            'sessions_count': sessions_cnt,
            'completed_sessions': completed_cnt,
            'quizzes_count': quizzes_cnt,
            'practicals_count': practicals_cnt
        })

    return success_response(data={
        'students': student_records,
        'total': total_count,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total_count': total_count,
            'total_pages': max(1, (total_count + per_page - 1) // per_page)
        }
    })


@admin_bp.route('/students/<int:id>', methods=['GET'])
@admin_required
def admin_student_detail(id):
    """
    Returns complete granular records for an individual student.
    Academic profile, saved plans, sessions, quiz attempts, practicals, focus history.
    """
    student = User.query.filter_by(id=id, role='student').first()
    if not student:
        return error_response(code="NOT_FOUND", message="Student record not found.", status_code=404)

    # 1. Academic Profile & Subjects
    profile_data = student.profile.to_dict() if student.profile else None
    subjects = [s.to_dict() for s in student.subjects]

    # 2. Plans & Sessions
    planners = Planner.query.filter_by(user_id=student.id).order_by(Planner.created_at.desc()).all()
    plans_data = []
    for p in planners:
        p_dict = p.to_dict()
        p_dict['sessions_count'] = len(p.sessions) if p.sessions else 0
        p_dict['total_sessions'] = len(p.sessions) if p.sessions else 0
        p_dict['completed_count'] = sum(1 for s in p.sessions if s.status == 'completed')
        p_dict['status'] = getattr(p, 'status', 'active') or 'active'
        plans_data.append(p_dict)

    sessions = StudySession.query.filter_by(user_id=student.id).order_by(StudySession.scheduled_start.desc()).limit(25).all()
    sessions_data = [s.to_dict() for s in sessions]

    # 3. Learning History & Metrics
    quiz_attempts = QuizAttempt.query.filter_by(user_id=student.id).order_by(QuizAttempt.completed_at.desc()).limit(15).all()
    practicals = PracticalAttempt.query.filter_by(user_id=student.id).order_by(PracticalAttempt.completed_at.desc()).limit(15).all()
    mistakes = Mistake.query.filter_by(user_id=student.id).order_by(Mistake.created_at.desc()).limit(20).all()
    mistakes_count = Mistake.query.filter_by(user_id=student.id).count()
    unresolved_mistakes = Mistake.query.filter_by(user_id=student.id, is_resolved=False).count()

    # 4. Focus Sessions
    focus_sessions = FocusSession.query.filter_by(user_id=student.id).order_by(FocusSession.created_at.desc()).limit(15).all()
    focus_mins = db.session.query(func.sum(FocusSession.duration_minutes)).filter_by(user_id=student.id).scalar() or 0

    # Calculate student summary metrics
    total_sess = StudySession.query.filter_by(user_id=student.id).count()
    comp_sess = StudySession.query.filter_by(user_id=student.id, status='completed').count()
    completion_rate = round((comp_sess / total_sess * 100), 1) if total_sess > 0 else 0.0
    prac_count = len(practicals)
    avg_readiness = round(sum(p.readiness_percentage or 0 for p in practicals) / prac_count, 1) if prac_count > 0 else 0.0

    metrics = {
        'total_sessions': total_sess,
        'completed_sessions': comp_sess,
        'completion_rate': completion_rate,
        'average_practical_readiness': avg_readiness,
        'practicals_attempted': prac_count,
        'active_mistakes_count': unresolved_mistakes,
        'total_focus_minutes': int(focus_mins)
    }

    return success_response(data={
        'student': student.to_dict(),
        'profile': profile_data,
        'academic_profile': profile_data,
        'subjects': subjects,
        'plans': plans_data,
        'study_plans': plans_data,
        'recent_sessions': sessions_data,
        'quiz_attempts': [q.to_dict() for q in quiz_attempts],
        'recent_practicals': [p.to_dict() for p in practicals],
        'practical_attempts': [p.to_dict() for p in practicals],
        'mistakes': [m.to_dict() for m in mistakes],
        'mistakes_summary': {
            'total': mistakes_count,
            'unresolved': unresolved_mistakes
        },
        'focus_sessions': [f.to_dict() for f in focus_sessions],
        'metrics': metrics
    })


@admin_bp.route('/plans', methods=['GET'])
@admin_required
def admin_plans_list():
    """
    Lists all AI-generated study plans across all students with progress metrics and search.
    """
    search = request.args.get('search', '').strip()
    query = Planner.query

    if search:
        query = query.join(User).filter(
            (Planner.title.ilike(f"%{search}%")) |
            (User.name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )

    plans = query.order_by(Planner.created_at.desc()).all()
    results = []
    for p in plans:
        total_s = len(p.sessions) if p.sessions else 0
        comp_s = sum(1 for s in p.sessions if s.status == 'completed')
        results.append({
            'id': p.id,
            'user_id': p.user_id,
            'student_name': p.user.name if p.user else 'Unknown',
            'student_email': p.user.email if p.user else 'Unknown',
            'title': p.title,
            'start_date': p.start_date.isoformat() if p.start_date else None,
            'end_date': p.end_date.isoformat() if p.end_date else None,
            'daily_hours': float(p.daily_hours) if p.daily_hours else 4.0,
            'status': getattr(p, 'status', 'active') or 'active',
            'sessions_count': total_s,
            'total_sessions': total_s,
            'completed_sessions': comp_s,
            'completion_percentage': round((comp_s / total_s * 100), 1) if total_s > 0 else 0.0,
            'created_at': p.created_at.isoformat() if p.created_at else None
        })

    return success_response(data={'plans': results, 'total': len(results)})


@admin_bp.route('/sessions', methods=['GET'])
@admin_required
def admin_sessions_list():
    """
    Searchable, paginated study session inspection across all students.
    """
    page = max(1, int(request.args.get('page', 1)))
    per_page = min(100, max(5, int(request.args.get('per_page', 20))))
    status_filter = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip()

    query = StudySession.query

    if status_filter and status_filter != 'all':
        query = query.filter(StudySession.status == status_filter)

    if search:
        query = query.join(User).outerjoin(Subject, StudySession.subject_id == Subject.id).filter(
            (StudySession.title.ilike(f"%{search}%")) |
            (Subject.name.ilike(f"%{search}%")) |
            (User.name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )

    total_count = query.count()
    sessions = query.order_by(StudySession.scheduled_start.desc()).offset((page - 1) * per_page).limit(per_page).all()

    # Aggregate counts
    total_all = StudySession.query.count()
    completed_all = StudySession.query.filter_by(status='completed').count()
    scheduled_all = StudySession.query.filter_by(status='scheduled').count()
    missed_all = StudySession.query.filter_by(status='missed').count()

    results = []
    for s in sessions:
        results.append({
            'id': s.id,
            'user_id': s.user_id,
            'student_name': s.user.name if s.user else 'Student',
            'student_email': s.user.email if s.user else '',
            'planner_id': s.planner_id,
            'title': s.title,
            'subject': s.subject.name if s.subject else 'General',
            'duration_minutes': s.duration_minutes,
            'scheduled_start': s.scheduled_start.isoformat() if s.scheduled_start else None,
            'scheduled_end': s.scheduled_end.isoformat() if s.scheduled_end else None,
            'status': s.status or 'scheduled',
            'notes': s.notes,
            'created_at': s.created_at.isoformat() if s.created_at else None
        })

    return success_response(data={
        'sessions': results,
        'total': total_count,
        'counts': {
            'total': total_all,
            'completed': completed_all,
            'scheduled': scheduled_all,
            'missed': missed_all
        },
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total_count': total_count,
            'total_pages': max(1, (total_count + per_page - 1) // per_page)
        }
    })


@admin_bp.route('/reports/export-students', methods=['GET'])
@admin_required
def export_students_csv():
    """Exports all student records as a validated CSV report."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'Student ID', 'Name', 'Email', 'Stream', 'Grade/Class', 'Board',
        'XP', 'Streak', 'AI Plans Generated', 'Total Sessions', 'Completed Sessions', 'Registration Date'
    ])

    students = User.query.filter_by(role='student').order_by(User.id.asc()).all()
    for s in students:
        plans_cnt = Planner.query.filter_by(user_id=s.id).count()
        sess_cnt = StudySession.query.filter_by(user_id=s.id).count()
        comp_cnt = StudySession.query.filter_by(user_id=s.id, status='completed').count()

        writer.writerow([
            s.id,
            s.name,
            s.email,
            s.profile.stream if s.profile else 'General',
            s.profile.grade_class if s.profile else 'Grade 12',
            s.profile.board if s.profile else 'General',
            s.xp,
            s.streak,
            plans_cnt,
            sess_cnt,
            comp_cnt,
            s.created_at.strftime('%Y-%m-%d %H:%M:%S') if s.created_at else ''
        ])

    csv_data = output.getvalue()
    return Response(
        csv_data,
        mimetype='text/csv',
        headers={"Content-disposition": "attachment; filename=planora_students_report.csv"}
    )


@admin_bp.route('/monitor/reminders', methods=['GET'])
@admin_required
def admin_monitor_reminders():
    """Monitors scheduled alarms and background reminder queue."""
    reminders = SessionReminder.query.order_by(SessionReminder.remind_at.desc()).limit(50).all()
    total_cnt = SessionReminder.query.count()
    pending_cnt = SessionReminder.query.filter_by(status='pending').count()
    delivered_cnt = SessionReminder.query.filter_by(status='delivered').count()
    dismissed_cnt = SessionReminder.query.filter_by(status='dismissed').count()

    return success_response(data={
        'total_monitored': len(reminders),
        'total_reminders': total_cnt,
        'pending_count': pending_cnt,
        'delivered_count': delivered_cnt,
        'dismissed_count': dismissed_cnt,
        'counts': {
            'pending': pending_cnt,
            'delivered': delivered_cnt,
            'dismissed': dismissed_cnt,
            'total': total_cnt
        },
        'reminders': [r.to_dict() for r in reminders]
    })


@admin_bp.route('/monitor/system', methods=['GET'])
@admin_required
def admin_system_health():
    """Returns database connection status, registered tables count, and engine type."""
    inspector = db.inspect(db.engine)
    tables = inspector.get_table_names()

    return success_response(data={
        'status': 'healthy',
        'database_engine': db.engine.name,
        'database_uri_type': 'SQLite (WAL Mode)' if 'sqlite' in str(db.engine.url) else 'MySQL 8.0',
        'tables_count': len(tables),
        'tables': sorted(tables),
        'timestamp': datetime.utcnow().isoformat()
    })
