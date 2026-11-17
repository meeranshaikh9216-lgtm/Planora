from datetime import datetime
from flask import Blueprint, request, g
from app.extensions import db
from app.models.academic import Subject, Topic, TopicPrerequisite, TopicProgress
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

subjects_bp = Blueprint('subjects', __name__, url_prefix='/api/subjects')

@subjects_bp.route('', methods=['GET'])
@jwt_required
def list_subjects():
    subjects = Subject.query.filter_by(user_id=g.user_id).all()
    return success_response(data={"subjects": [s.to_dict() for s in subjects]})

@subjects_bp.route('', methods=['POST'])
@jwt_required
def create_subject():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return error_response(code="VALIDATION_ERROR", message="Subject name is required.")

    exam_date = None
    if data.get('exam_date'):
        try:
            exam_date = datetime.strptime(data['exam_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    subject = Subject(
        user_id=g.user_id,
        name=name,
        code=data.get('code'),
        color=data.get('color', '#6366f1'),
        icon=data.get('icon', 'book'),
        target_score=data.get('target_score'),
        exam_date=exam_date
    )
    db.session.add(subject)
    db.session.commit()
    return success_response(data={"subject": subject.to_dict()}, message="Subject created successfully.", status_code=201)

@subjects_bp.route('/<int:id>', methods=['GET'])
@jwt_required
def get_subject(id):
    subject = Subject.query.filter_by(id=id, user_id=g.user_id).first()
    if not subject:
        return error_response(code="NOT_FOUND", message="Subject not found.", status_code=404)

    topics = [t.to_dict(user_id=g.user_id) for t in subject.topics]
    data = subject.to_dict()
    data['topics'] = topics
    return success_response(data={"subject": data})

@subjects_bp.route('/<int:id>', methods=['PUT'])
@jwt_required
def update_subject(id):
    subject = Subject.query.filter_by(id=id, user_id=g.user_id).first()
    if not subject:
        return error_response(code="NOT_FOUND", message="Subject not found.", status_code=404)

    data = request.get_json() or {}
    if 'name' in data:
        subject.name = data['name'].strip()
    if 'code' in data:
        subject.code = data['code']
    if 'color' in data:
        subject.color = data['color']
    if 'icon' in data:
        subject.icon = data['icon']
    if 'target_score' in data:
        subject.target_score = data['target_score']
    if 'exam_date' in data and data['exam_date']:
        try:
            subject.exam_date = datetime.strptime(data['exam_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    db.session.commit()
    return success_response(data={"subject": subject.to_dict()}, message="Subject updated successfully.")

@subjects_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required
def delete_subject(id):
    subject = Subject.query.filter_by(id=id, user_id=g.user_id).first()
    if not subject:
        return error_response(code="NOT_FOUND", message="Subject not found.", status_code=404)

    db.session.delete(subject)
    db.session.commit()
    return success_response(message="Subject deleted successfully.")

@subjects_bp.route('/<int:id>/topics', methods=['GET'])
@jwt_required
def list_topics(id):
    subject = Subject.query.filter_by(id=id, user_id=g.user_id).first()
    if not subject:
        return error_response(code="NOT_FOUND", message="Subject not found.", status_code=404)

    topics = [t.to_dict(user_id=g.user_id) for t in subject.topics]
    return success_response(data={"topics": topics})

@subjects_bp.route('/<int:id>/topics', methods=['POST'])
@jwt_required
def create_topic(id):
    subject = Subject.query.filter_by(id=id, user_id=g.user_id).first()
    if not subject:
        return error_response(code="NOT_FOUND", message="Subject not found.", status_code=404)

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return error_response(code="VALIDATION_ERROR", message="Topic name is required.")

    topic = Topic(
        subject_id=subject.id,
        name=name,
        description=data.get('description'),
        chapter=data.get('chapter'),
        difficulty=data.get('difficulty', 'Medium'),
        estimated_minutes=int(data.get('estimated_minutes', 60)),
        order_index=int(data.get('order_index', len(subject.topics) + 1))
    )
    db.session.add(topic)
    db.session.flush()

    # Handle prerequisites if passed
    prereq_ids = data.get('prerequisite_ids', [])
    for p_id in prereq_ids:
        prereq = Topic.query.get(p_id)
        if prereq:
            topic.prerequisites.append(prereq)

    # Initial topic progress record
    prog = TopicProgress(
        user_id=g.user_id,
        topic_id=topic.id,
        status='not_started',
        confidence_level=1
    )
    db.session.add(prog)
    db.session.commit()

    return success_response(data={"topic": topic.to_dict(user_id=g.user_id)}, message="Topic created successfully.", status_code=201)

# Individual Topic routes under /api/topics
topics_bp = Blueprint('topics', __name__, url_prefix='/api/topics')

@topics_bp.route('/<int:id>', methods=['GET'])
@jwt_required
def get_topic(id):
    topic = Topic.query.get(id)
    if not topic or (topic.subject and topic.subject.user_id != g.user_id):
        return error_response(code="NOT_FOUND", message="Topic not found.", status_code=404)

    return success_response(data={"topic": topic.to_dict(user_id=g.user_id)})

@topics_bp.route('/<int:id>', methods=['PUT'])
@jwt_required
def update_topic(id):
    topic = Topic.query.get(id)
    if not topic or (topic.subject and topic.subject.user_id != g.user_id):
        return error_response(code="NOT_FOUND", message="Topic not found.", status_code=404)

    data = request.get_json() or {}
    if 'name' in data:
        topic.name = data['name'].strip()
    if 'description' in data:
        topic.description = data['description']
    if 'chapter' in data:
        topic.chapter = data['chapter']
    if 'difficulty' in data:
        topic.difficulty = data['difficulty']
    if 'estimated_minutes' in data:
        topic.estimated_minutes = int(data['estimated_minutes'])

    # Update confidence / status if provided
    prog = TopicProgress.query.filter_by(user_id=g.user_id, topic_id=topic.id).first()
    if not prog:
        prog = TopicProgress(user_id=g.user_id, topic_id=topic.id)
        db.session.add(prog)

    if 'status' in data:
        prog.status = data['status']
    if 'confidence_level' in data:
        prog.confidence_level = int(data['confidence_level'])

    db.session.commit()
    return success_response(data={"topic": topic.to_dict(user_id=g.user_id)}, message="Topic updated.")
