from datetime import datetime
from flask import Blueprint, request, g
from app.extensions import db
from app.models.note import Flashcard
from app.models.academic import Topic, Subject
from app.ai.ai_service import ai_service
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

flashcards_bp = Blueprint('flashcards', __name__, url_prefix='/api/flashcards')

@flashcards_bp.route('', methods=['GET'])
@jwt_required
def list_flashcards():
    subject_id = request.args.get('subject_id')
    topic_id = request.args.get('topic_id')
    mastery = request.args.get('mastery_level')

    query = Flashcard.query.filter_by(user_id=g.user_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if topic_id:
        query = query.filter_by(topic_id=topic_id)
    if mastery:
        query = query.filter_by(mastery_level=mastery)

    cards = query.order_by(Flashcard.created_at.desc()).all()
    return success_response(data={"flashcards": [c.to_dict() for c in cards]})

@flashcards_bp.route('/generate', methods=['POST'])
@jwt_required
def generate_ai_flashcards():
    data = request.get_json() or {}
    topic_id = data.get('topic_id')
    subject_id = data.get('subject_id')
    count = int(data.get('count', 5))

    if not topic_id:
        return error_response(code="VALIDATION_ERROR", message="Topic ID is required.")

    topic = Topic.query.get(topic_id)
    if not topic:
        return error_response(code="NOT_FOUND", message="Topic not found.", status_code=404)

    subject_name = topic.subject.name if topic.subject else "General"

    cards_data = ai_service.generate_flashcards(topic=topic.name, subject=subject_name, count=count)
    saved_cards = []

    for item in cards_data:
        fc = Flashcard(
            user_id=g.user_id,
            subject_id=subject_id or topic.subject_id,
            topic_id=topic.id,
            front_text=item.get('front', ''),
            back_text=item.get('back', ''),
            difficulty=item.get('difficulty', 'Medium'),
            mastery_level='new'
        )
        db.session.add(fc)
        saved_cards.append(fc)

    db.session.commit()
    return success_response(
        data={"flashcards": [c.to_dict() for c in saved_cards]},
        message=f"{len(saved_cards)} AI Flashcards generated and saved!",
        status_code=201
    )

@flashcards_bp.route('', methods=['POST'])
@jwt_required
def create_flashcard():
    data = request.get_json() or {}
    front = data.get('front_text', '').strip()
    back = data.get('back_text', '').strip()
    subject_id = data.get('subject_id')

    if not front or not back or not subject_id:
        return error_response(code="VALIDATION_ERROR", message="Front text, back text, and subject_id are required.")

    fc = Flashcard(
        user_id=g.user_id,
        subject_id=subject_id,
        topic_id=data.get('topic_id'),
        front_text=front,
        back_text=back,
        difficulty=data.get('difficulty', 'Medium'),
        mastery_level='new'
    )
    db.session.add(fc)
    db.session.commit()
    return success_response(data={"flashcard": fc.to_dict()}, message="Flashcard created.", status_code=201)

@flashcards_bp.route('/<int:id>/review', methods=['PUT'])
@jwt_required
def review_flashcard(id):
    fc = Flashcard.query.filter_by(id=id, user_id=g.user_id).first()
    if not fc:
        return error_response(code="NOT_FOUND", message="Flashcard not found.", status_code=404)

    data = request.get_json() or {}
    mastery = data.get('mastery_level', 'known') # 'known', 'need_revision', 'difficult'

    fc.mastery_level = mastery
    fc.last_reviewed_at = datetime.utcnow()
    db.session.commit()

    return success_response(data={"flashcard": fc.to_dict()}, message="Flashcard mastery updated.")

@flashcards_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required
def delete_flashcard(id):
    fc = Flashcard.query.filter_by(id=id, user_id=g.user_id).first()
    if not fc:
        return error_response(code="NOT_FOUND", message="Flashcard not found.", status_code=404)

    db.session.delete(fc)
    db.session.commit()
    return success_response(message="Flashcard deleted.")
