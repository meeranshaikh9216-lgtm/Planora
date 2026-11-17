from datetime import datetime
from flask import Blueprint, request, g
from app.extensions import db
from app.models.user import StudentProfile, User
from app.models.academic import Subject, Topic, TopicProgress
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')

@profile_bp.route('', methods=['GET'])
@jwt_required
def get_profile():
    profile = StudentProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        profile = StudentProfile(user_id=g.user_id, grade_class='Grade 12', board='General', stream='General')
        db.session.add(profile)
        db.session.commit()
    return success_response(data={"profile": profile.to_dict(), "user": g.current_user.to_dict()})

@profile_bp.route('', methods=['PUT'])
@jwt_required
def update_profile():
    data = request.get_json() or {}
    profile = StudentProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        profile = StudentProfile(user_id=g.user_id)
        db.session.add(profile)

    if 'name' in data and data['name']:
        g.current_user.name = data['name'].strip()

    if 'grade_class' in data:
        profile.grade_class = data['grade_class']
    if 'board' in data:
        profile.board = data['board']
    if 'stream' in data:
        profile.stream = data['stream']
    if 'daily_study_hours' in data:
        profile.daily_study_hours = float(data['daily_study_hours'])
    if 'preferred_study_time' in data:
        profile.preferred_study_time = data['preferred_study_time']
    if 'study_goal' in data:
        profile.study_goal = data['study_goal']
    if 'target_score' in data:
        profile.target_score = data['target_score']
    if 'exam_date' in data and data['exam_date']:
        try:
            profile.exam_date = datetime.strptime(data['exam_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    db.session.commit()
    return success_response(data={"profile": profile.to_dict(), "user": g.current_user.to_dict()}, message="Profile updated successfully.")

@profile_bp.route('/onboarding', methods=['POST'])
@jwt_required
def complete_onboarding():
    data = request.get_json() or {}
    profile = StudentProfile.query.filter_by(user_id=g.user_id).first()
    if not profile:
        profile = StudentProfile(user_id=g.user_id)
        db.session.add(profile)

    # 1. Update basic fields
    if 'name' in data and data['name']:
        g.current_user.name = data['name'].strip()

    profile.grade_class = data.get('grade_class', 'Grade 12')
    profile.board = data.get('board', 'CBSE')
    profile.stream = data.get('stream', 'Science')
    profile.daily_study_hours = float(data.get('daily_study_hours', 4.0))
    profile.preferred_study_time = data.get('preferred_study_time', 'evening')
    profile.study_goal = data.get('study_goal', 'Score 90%+ in final exams')
    profile.target_score = data.get('target_score', '90%')
    profile.onboarding_completed = True

    if 'exam_date' in data and data['exam_date']:
        try:
            profile.exam_date = datetime.strptime(data['exam_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    # 2. Process subjects
    subjects_input = data.get('subjects', [])
    default_colors = ['#6366f1', '#38bdf8', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6']
    default_topics = {
        'Mathematics': ['Limits & Continuity', 'Differentiation', 'Integration', 'Differential Equations'],
        'Physics': ['Electrostatics', 'Current Electricity', 'Electromagnetic Induction', 'Optics'],
        'Chemistry': ['Chemical Kinetics', 'Electrochemistry', 'Organic Reaction Mechanisms', 'Solutions'],
        'Biology': ['Genetics & Evolution', 'Cell Biology', 'Human Physiology', 'Biotechnology'],
        'Computer Science': ['Data Structures', 'Algorithms', 'SQL & Databases', 'Networking']
    }

    created_subjects = []
    for idx, sub_item in enumerate(subjects_input):
        sub_name = sub_item if isinstance(sub_item, str) else sub_item.get('name')
        if not sub_name:
            continue
        sub_name = sub_name.strip()

        # Check if subject already exists
        existing_sub = Subject.query.filter_by(user_id=g.user_id, name=sub_name).first()
        if not existing_sub:
            color = default_colors[idx % len(default_colors)]
            sub = Subject(
                user_id=g.user_id,
                name=sub_name,
                color=color,
                exam_date=profile.exam_date
            )
            db.session.add(sub)
            db.session.flush()

            # Seed standard topics for known subjects so user has immediate rich data
            topics_to_seed = default_topics.get(sub_name, ['Fundamentals', 'Core Principles', 'Advanced Applications'])
            for t_idx, t_name in enumerate(topics_to_seed):
                diff = 'Easy' if t_idx == 0 else ('Hard' if t_idx >= 2 else 'Medium')
                topic = Topic(
                    subject_id=sub.id,
                    name=t_name,
                    chapter=sub_name,
                    difficulty=diff,
                    order_index=t_idx + 1
                )
                db.session.add(topic)
                db.session.flush()

                # Add initial progress
                prog = TopicProgress(
                    user_id=g.user_id,
                    topic_id=topic.id,
                    status='learning' if t_idx == 0 else 'not_started',
                    confidence_level=3 if t_idx == 0 else 1
                )
                db.session.add(prog)

            created_subjects.append(sub)

    db.session.commit()
    return success_response(
        data={
            "profile": profile.to_dict(),
            "user": g.current_user.to_dict(),
            "subjects_created": len(created_subjects)
        },
        message="Onboarding completed successfully! Your personalized study setup is ready."
    )
