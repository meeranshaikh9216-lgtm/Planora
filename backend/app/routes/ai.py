from flask import Blueprint, request, g
from app.extensions import db
from app.models.ai import AIConversation, AIMessage
from app.models.academic import Topic, Subject
from app.ai.ai_service import ai_service
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

@ai_bp.route('/explain', methods=['POST'])
@jwt_required
def explain_topic():
    data = request.get_json() or {}
    topic_name = data.get('topic', '').strip()
    subject_name = data.get('subject', 'General').strip()
    mode = data.get('mode', 'standard') # standard, simplified, step_by_step, teach_me_back
    grade = data.get('grade', 'Grade 12')

    if not topic_name:
        return error_response(code="VALIDATION_ERROR", message="Topic name is required.")

    result = ai_service.explain_topic(topic_name, subject_name, grade=grade, mode=mode)
    return success_response(data=result)

@ai_bp.route('/doubt', methods=['POST'])
@jwt_required
def solve_doubt():
    data = request.get_json() or {}
    question_text = data.get('question_text', '').strip()
    image_b64 = data.get('image_b64')
    subject = data.get('subject')

    if not question_text and not image_b64:
        return error_response(code="VALIDATION_ERROR", message="Please provide a question text or upload an image.")

    result = ai_service.solve_doubt(question_text=question_text, image_b64=image_b64, subject=subject)
    return success_response(data=result)

@ai_bp.route('/chat', methods=['POST'])
@jwt_required
def chat_with_tutor():
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    conversation_id = data.get('conversation_id')
    topic_id = data.get('topic_id')
    mode = data.get('mode', 'tutor')

    if not message:
        return error_response(code="VALIDATION_ERROR", message="Message cannot be empty.")

    # Get or create conversation
    if conversation_id:
        conv = AIConversation.query.filter_by(id=conversation_id, user_id=g.user_id).first()
        if not conv:
            return error_response(code="NOT_FOUND", message="Conversation not found.", status_code=404)
    else:
        title = message[:40] + ("..." if len(message) > 40 else "")
        conv = AIConversation(
            user_id=g.user_id,
            topic_id=topic_id,
            title=title,
            mode=mode
        )
        db.session.add(conv)
        db.session.flush()

    # Save student's message
    user_msg = AIMessage(
        conversation_id=conv.id,
        role='user',
        content=message
    )
    db.session.add(user_msg)

    # Build prompt context from conversation history
    history = AIMessage.query.filter_by(conversation_id=conv.id).order_by(AIMessage.created_at.asc()).limit(8).all()
    history_prompt = "\n".join([f"{m.role}: {m.content}" for m in history])

    system_instruction = (
        "You are Planora's AI Tutor. Answer student queries clearly, patiently, and accurately. "
        "Use markdown formatting with bold terms, bullet points, and clean formulas."
    )
    full_prompt = f"Previous conversation:\n{history_prompt}\n\nPlease respond to the user's latest query."

    ai_reply = ai_service.generate_text(full_prompt, system_instruction=system_instruction)

    # Save assistant message
    ai_msg = AIMessage(
        conversation_id=conv.id,
        role='assistant',
        content=ai_reply
    )
    db.session.add(ai_msg)
    db.session.commit()

    return success_response(data={
        "conversation_id": conv.id,
        "reply": ai_reply,
        "message": ai_msg.to_dict()
    })

@ai_bp.route('/conversations', methods=['GET'])
@jwt_required
def list_conversations():
    convs = AIConversation.query.filter_by(user_id=g.user_id).order_by(AIConversation.updated_at.desc()).all()
    return success_response(data={"conversations": [c.to_dict() for c in convs]})

@ai_bp.route('/conversations/<int:id>', methods=['GET'])
@jwt_required
def get_conversation(id):
    conv = AIConversation.query.filter_by(id=id, user_id=g.user_id).first()
    if not conv:
        return error_response(code="NOT_FOUND", message="Conversation not found.", status_code=404)
    return success_response(data={"conversation": conv.to_dict(include_messages=True)})

@ai_bp.route('/visual-explanation', methods=['POST'])
@jwt_required
def visual_explanation():
    data = request.get_json() or {}
    topic_name = data.get('topic', '').strip()
    subject_name = data.get('subject', 'General').strip()

    if not topic_name:
        return error_response(code="VALIDATION_ERROR", message="Topic name is required.")

    # Generate dynamic visual explanation from Gemini AI
    visual_data = ai_service.visual_explanation(topic=topic_name, subject=subject_name)
    return success_response(data=visual_data)
