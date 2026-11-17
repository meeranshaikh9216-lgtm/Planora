from datetime import datetime
from flask import Blueprint, request, g
from app.extensions import db
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from app.models.academic import Topic, Subject, TopicProgress
from app.models.revision import Mistake
from app.ai.ai_service import ai_service
from app.services.revision_service import RevisionService
from app.services.gamification_service import GamificationService
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

quizzes_bp = Blueprint('quizzes', __name__, url_prefix='/api/quizzes')

@quizzes_bp.route('', methods=['GET'])
@jwt_required
def list_quizzes():
    subject_id = request.args.get('subject_id')
    topic_id = request.args.get('topic_id')

    query = Quiz.query.filter_by(user_id=g.user_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if topic_id:
        query = query.filter_by(topic_id=topic_id)

    quizzes = query.order_by(Quiz.created_at.desc()).all()
    return success_response(data={"quizzes": [q.to_dict() for q in quizzes]})

@quizzes_bp.route('/generate', methods=['POST'])
@jwt_required
def generate_quiz():
    data = request.get_json() or {}
    subject_id = data.get('subject_id')
    topic_id = data.get('topic_id')
    difficulty = data.get('difficulty', 'Medium')
    num_questions = int(data.get('num_questions', 5))

    if not subject_id:
        return error_response(code="VALIDATION_ERROR", message="Subject ID is required.")

    subject = Subject.query.filter_by(id=subject_id, user_id=g.user_id).first()
    if not subject:
        return error_response(code="NOT_FOUND", message="Subject not found.", status_code=404)

    topic_name = "Comprehensive Assessment"
    if topic_id:
        topic = Topic.query.get(topic_id)
        if topic:
            topic_name = topic.name

    # 1. Ask AI service to generate MCQ questions
    generated_questions = ai_service.generate_quiz(
        topic=topic_name,
        subject=subject.name,
        difficulty=difficulty,
        num_questions=num_questions
    )

    if not generated_questions:
        return error_response(code="GENERATION_FAILED", message="Failed to generate quiz questions.")

    # 2. Store Quiz in MySQL
    quiz = Quiz(
        user_id=g.user_id,
        subject_id=subject.id,
        topic_id=topic_id,
        title=f"{subject.name}: {topic_name} Quiz",
        difficulty=difficulty,
        total_questions=len(generated_questions)
    )
    db.session.add(quiz)
    db.session.flush()

    for q_item in generated_questions:
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_item.get('question_text', ''),
            option_a=q_item.get('option_a', ''),
            option_b=q_item.get('option_b', ''),
            option_c=q_item.get('option_c', ''),
            option_d=q_item.get('option_d', ''),
            correct_option=q_item.get('correct_option', 'A').upper(),
            explanation=q_item.get('explanation', '')
        )
        db.session.add(qq)

    db.session.commit()

    return success_response(
        data={"quiz": quiz.to_dict(include_questions=True, include_answers=False)},
        message="AI Quiz created successfully!",
        status_code=201
    )

@quizzes_bp.route('/<int:id>', methods=['GET'])
@jwt_required
def get_quiz(id):
    quiz = Quiz.query.filter_by(id=id, user_id=g.user_id).first()
    if not quiz:
        return error_response(code="NOT_FOUND", message="Quiz not found.", status_code=404)

    include_answers = request.args.get('include_answers', 'false').lower() == 'true'
    return success_response(data={"quiz": quiz.to_dict(include_questions=True, include_answers=include_answers)})

@quizzes_bp.route('/<int:id>/submit', methods=['POST'])
@jwt_required
def submit_quiz(id):
    """
    Evaluates student answers strictly in Python backend code.
    Calculates score, stores attempt, records mistakes into Mistake Bank,
    updates TopicProgress telemetry, and awards gamification XP.
    """
    quiz = Quiz.query.filter_by(id=id, user_id=g.user_id).first()
    if not quiz:
        return error_response(code="NOT_FOUND", message="Quiz not found.", status_code=404)

    data = request.get_json() or {}
    answers_input = data.get('answers', {}) # dict of question_id: selected_option ('A','B','C','D')
    time_taken = int(data.get('time_taken_seconds', 0))

    score = 0
    total = len(quiz.questions)

    attempt = QuizAttempt(
        user_id=g.user_id,
        quiz_id=quiz.id,
        score=0, # will update below
        total_questions=total,
        percentage=0.0,
        time_taken_seconds=time_taken,
        completed_at=datetime.utcnow()
    )
    db.session.add(attempt)
    db.session.flush()

    answer_evaluations = []
    mistakes_added = 0

    for q in quiz.questions:
        selected = answers_input.get(str(q.id)) or answers_input.get(q.id)
        selected = (str(selected).upper() if selected else '')
        is_correct = (selected == q.correct_option.upper())

        if is_correct:
            score += 1

        ans_record = QuizAnswer(
            attempt_id=attempt.id,
            question_id=q.id,
            selected_option=selected,
            is_correct=is_correct
        )
        db.session.add(ans_record)

        # If answer was incorrect, automatically save into Mistake Bank!
        if not is_correct:
            existing_mistake = Mistake.query.filter_by(
                user_id=g.user_id,
                subject_id=quiz.subject_id,
                topic_id=quiz.topic_id,
                question_text=q.question_text
            ).first()

            correct_text = getattr(q, f"option_{q.correct_option.lower()}", q.correct_option)
            student_text = getattr(q, f"option_{selected.lower()}", selected) if selected in ['A', 'B', 'C', 'D'] else 'Not answered'

            if existing_mistake:
                existing_mistake.recurrence_count += 1
                existing_mistake.student_answer = student_text
                existing_mistake.is_resolved = False
            else:
                mistake = Mistake(
                    user_id=g.user_id,
                    subject_id=quiz.subject_id,
                    topic_id=quiz.topic_id,
                    question_text=q.question_text,
                    student_answer=student_text,
                    correct_answer=correct_text,
                    explanation=q.explanation,
                    recurrence_count=1,
                    is_resolved=False
                )
                db.session.add(mistake)
                mistakes_added += 1

        answer_evaluations.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "options": {"A": q.option_a, "B": q.option_b, "C": q.option_c, "D": q.option_d},
            "selected_option": selected,
            "correct_option": q.correct_option,
            "is_correct": is_correct,
            "explanation": q.explanation
        })

    # Finalize score & percentage in Python
    percentage = round((score / total * 100.0), 1) if total > 0 else 0.0
    attempt.score = score
    attempt.percentage = percentage

    # Update TopicProgress telemetry
    if quiz.topic_id:
        prog = TopicProgress.query.filter_by(user_id=g.user_id, topic_id=quiz.topic_id).first()
        if not prog:
            prog = TopicProgress(user_id=g.user_id, topic_id=quiz.topic_id)
            db.session.add(prog)

        prev_count = prog.quiz_attempts_count or 0
        prev_avg = float(prog.average_quiz_score or 0.0)
        new_count = prev_count + 1
        new_avg = round(((prev_avg * prev_count) + percentage) / new_count, 1)

        prog.quiz_attempts_count = new_count
        prog.average_quiz_score = new_avg

        if percentage >= 80:
            prog.status = 'mastered'
            prog.confidence_level = min(5, (prog.confidence_level or 1) + 1)
        elif percentage < 60:
            prog.status = 'needs_revision'
            prog.confidence_level = max(1, (prog.confidence_level or 3) - 1)

        # Trigger automatic spaced revision queue
        RevisionService.schedule_initial_revisions(g.user_id, quiz.topic_id)

    db.session.commit()

    # Award XP (+50 XP for quiz completion)
    GamificationService.award_xp(g.user_id, 50, reason="Quiz Completed")

    return success_response(
        data={
            "attempt_id": attempt.id,
            "score": score,
            "total_questions": total,
            "percentage": percentage,
            "time_taken_seconds": time_taken,
            "evaluations": answer_evaluations,
            "mistakes_recorded": mistakes_added,
            "recommendation": (
                "Flawless performance! Concept mastered." if percentage >= 85 else
                "Good effort! Review the incorrect answers and scheduled revisions." if percentage >= 60 else
                "Knowledge gap detected. We have added incorrect questions to your Mistake Bank."
            )
        },
        message=f"Quiz submitted: {score}/{total} ({percentage}%). +50 XP awarded!"
    )

@quizzes_bp.route('/attempts/<int:attempt_id>', methods=['GET'])
@jwt_required
def get_attempt_details(attempt_id):
    attempt = QuizAttempt.query.filter_by(id=attempt_id, user_id=g.user_id).first()
    if not attempt:
        return error_response(code="NOT_FOUND", message="Quiz attempt not found.", status_code=404)

    return success_response(data={"attempt": attempt.to_dict()})
