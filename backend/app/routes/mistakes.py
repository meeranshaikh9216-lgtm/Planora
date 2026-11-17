from flask import Blueprint, request, g
from app.extensions import db
from app.models.revision import Mistake
from app.models.quiz import Quiz, QuizQuestion
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

mistakes_bp = Blueprint('mistakes', __name__, url_prefix='/api/mistakes')

@mistakes_bp.route('', methods=['GET'])
@jwt_required
def list_mistakes():
    subject_id = request.args.get('subject_id')
    is_resolved_param = request.args.get('is_resolved')

    query = Mistake.query.filter_by(user_id=g.user_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if is_resolved_param is not None:
        is_resolved = is_resolved_param.lower() == 'true'
        query = query.filter_by(is_resolved=is_resolved)

    mistakes = query.order_by(Mistake.recurrence_count.desc(), Mistake.created_at.desc()).all()
    return success_response(data={"mistakes": [m.to_dict() for m in mistakes]})

@mistakes_bp.route('/<int:id>/resolve', methods=['PUT'])
@jwt_required
def toggle_resolve_mistake(id):
    mistake = Mistake.query.filter_by(id=id, user_id=g.user_id).first()
    if not mistake:
        return error_response(code="NOT_FOUND", message="Mistake not found.", status_code=404)

    data = request.get_json() or {}
    mistake.is_resolved = data.get('is_resolved', not mistake.is_resolved)
    db.session.commit()

    return success_response(
        data={"mistake": mistake.to_dict()},
        message="Mistake marked as resolved!" if mistake.is_resolved else "Mistake reopened."
    )

@mistakes_bp.route('/quiz', methods=['POST'])
@jwt_required
def generate_quiz_from_mistakes():
    """
    Builds a custom practice quiz directly from the student's active mistakes.
    """
    unresolved = Mistake.query.filter_by(user_id=g.user_id, is_resolved=False).limit(5).all()
    if not unresolved:
        return error_response(code="NO_MISTAKES", message="No active mistakes found in your Mistake Bank! Great job.", status_code=400)

    first = unresolved[0]
    quiz = Quiz(
        user_id=g.user_id,
        subject_id=first.subject_id,
        topic_id=first.topic_id,
        title="Mistake Bank Remedial Quiz",
        difficulty="Medium",
        total_questions=len(unresolved)
    )
    db.session.add(quiz)
    db.session.flush()

    for m in unresolved:
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question_text=m.question_text,
            option_a=m.correct_answer,
            option_b=m.student_answer or "Incorrect Assumption B",
            option_c="Alternative Formulation C",
            option_d="Boundary Failure D",
            correct_option="A",
            explanation=m.explanation or "Carefully review the conceptual theorem."
        )
        db.session.add(qq)

    db.session.commit()
    return success_response(
        data={"quiz": quiz.to_dict(include_questions=True, include_answers=False)},
        message=f"Created custom practice quiz with {len(unresolved)} targeted mistake questions!",
        status_code=201
    )
