from flask import Blueprint, request, g
from app.extensions import db
from app.models.note import Note
from app.models.academic import Topic, Subject
from app.ai.ai_service import ai_service
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

notes_bp = Blueprint('notes', __name__, url_prefix='/api/notes')

@notes_bp.route('', methods=['GET'])
@jwt_required
def list_notes():
    subject_id = request.args.get('subject_id')
    topic_id = request.args.get('topic_id')

    query = Note.query.filter_by(user_id=g.user_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if topic_id:
        query = query.filter_by(topic_id=topic_id)

    notes = query.order_by(Note.created_at.desc()).all()
    return success_response(data={"notes": [n.to_dict() for n in notes]})

@notes_bp.route('/generate', methods=['POST'])
@jwt_required
def generate_ai_notes():
    data = request.get_json() or {}
    topic_id = data.get('topic_id')
    subject_id = data.get('subject_id')

    if not topic_id:
        return error_response(code="VALIDATION_ERROR", message="Topic ID is required.")

    topic = Topic.query.get(topic_id)
    if not topic:
        return error_response(code="NOT_FOUND", message="Topic not found.", status_code=404)

    subject_name = topic.subject.name if topic.subject else "General"

    # Call AI service
    ai_result = ai_service.generate_notes(topic=topic.name, subject=subject_name)

    # Save generated notes in MySQL
    note = Note(
        user_id=g.user_id,
        subject_id=subject_id or topic.subject_id,
        topic_id=topic.id,
        title=ai_result.get('title', f"Notes: {topic.name}"),
        summary=ai_result.get('summary', ''),
        key_points=ai_result.get('key_points', []),
        formulas=ai_result.get('formulas', []),
        examples=ai_result.get('examples', []),
        exam_tips=ai_result.get('exam_tips', [])
    )
    db.session.add(note)
    db.session.commit()

    return success_response(
        data={"note": note.to_dict()},
        message="AI Notes generated and saved to MySQL!",
        status_code=201
    )

@notes_bp.route('', methods=['POST'])
@jwt_required
def create_note():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    subject_id = data.get('subject_id')

    if not title or not subject_id:
        return error_response(code="VALIDATION_ERROR", message="Title and subject_id are required.")

    note = Note(
        user_id=g.user_id,
        subject_id=subject_id,
        topic_id=data.get('topic_id'),
        title=title,
        summary=data.get('summary'),
        key_points=data.get('key_points', []),
        formulas=data.get('formulas', []),
        examples=data.get('examples', []),
        exam_tips=data.get('exam_tips', []),
        raw_content=data.get('raw_content')
    )
    db.session.add(note)
    db.session.commit()
    return success_response(data={"note": note.to_dict()}, message="Note created successfully.", status_code=201)

@notes_bp.route('/<int:id>', methods=['GET'])
@jwt_required
def get_note(id):
    note = Note.query.filter_by(id=id, user_id=g.user_id).first()
    if not note:
        return error_response(code="NOT_FOUND", message="Note not found.", status_code=404)
    return success_response(data={"note": note.to_dict()})

@notes_bp.route('/<int:id>', methods=['PUT'])
@jwt_required
def update_note(id):
    note = Note.query.filter_by(id=id, user_id=g.user_id).first()
    if not note:
        return error_response(code="NOT_FOUND", message="Note not found.", status_code=404)

    data = request.get_json() or {}
    if 'title' in data:
        note.title = data['title'].strip()
    if 'summary' in data:
        note.summary = data['summary']
    if 'key_points' in data:
        note.key_points = data['key_points']
    if 'formulas' in data:
        note.formulas = data['formulas']
    if 'examples' in data:
        note.examples = data['examples']
    if 'exam_tips' in data:
        note.exam_tips = data['exam_tips']
    if 'raw_content' in data:
        note.raw_content = data['raw_content']

    db.session.commit()
    return success_response(data={"note": note.to_dict()}, message="Note updated successfully.")

@notes_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required
def delete_note(id):
    note = Note.query.filter_by(id=id, user_id=g.user_id).first()
    if not note:
        return error_response(code="NOT_FOUND", message="Note not found.", status_code=404)

    db.session.delete(note)
    db.session.commit()
    return success_response(message="Note deleted.")
