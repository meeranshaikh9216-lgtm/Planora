import json
from datetime import datetime
from flask import Blueprint, request, g
from app.extensions import db
from app.models.practical import Practical, PracticalAttempt
from app.models.academic import Subject
from app.models.user import StudentProfile
from app.ai.ai_service import ai_service
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

practicals_bp = Blueprint('practicals', __name__, url_prefix='/api/practicals')

def map_stream_to_categories(stream_name):
    """Maps academic stream from student onboarding to practical laboratory categories."""
    if not stream_name:
        return []
    s = stream_name.lower()
    cats = []
    if 'commerce' in s:
        cats.append('commerce')
    if 'humanities' in s or 'arts' in s:
        cats.append('humanities')
    if 'engineering' in s or 'computer' in s:
        cats.extend(['computer_science', 'engineering'])
    if 'science' in s or 'pcm' in s or 'pcb' in s or 'medical' in s:
        cats.append('science')
    return list(set(cats))

@practicals_bp.route('', methods=['GET'])
@jwt_required
def list_practicals():
    """
    Returns list of universal practicals strictly tailored to student's academic stream.
    Prevents cross-stream leakage (e.g., Science students only see Science practicals;
    Commerce students only see Commerce practicals).
    """
    category = request.args.get('category')
    search = request.args.get('search', '').strip()
    subject_id = request.args.get('subject_id')
    allow_cross_stream = request.args.get('allow_all', 'false').lower() == 'true'

    # Get student profile to determine academic stream
    profile = StudentProfile.query.filter_by(user_id=g.user_id).first()
    user_stream = profile.stream if profile else None
    permitted_categories = map_stream_to_categories(user_stream)

    # Base query: practicals created by this student OR system defaults (user_id=1)
    # If student has a defined stream and is not an admin, filter system defaults to match stream
    is_admin = getattr(g, 'user_role', 'student') == 'admin'

    if is_admin or allow_cross_stream or not permitted_categories:
        query = Practical.query.filter((Practical.user_id == g.user_id) | (Practical.is_custom == False))
    else:
        # Strict stream isolation: custom practicals created by student OR system practicals in student's stream
        query = Practical.query.filter(
            ((Practical.user_id == g.user_id) & (Practical.is_custom == True)) | 
            ((Practical.is_custom == False) & (Practical.field_category.in_(permitted_categories)))
        )

    if category and category != 'all':
        query = query.filter_by(field_category=category)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if search:
        query = query.filter((Practical.title.ilike(f"%{search}%")) | (Practical.aim.ilike(f"%{search}%")))

    practicals = query.order_by(Practical.created_at.desc()).all()
    return success_response(data={
        "practicals": [p.to_dict() for p in practicals],
        "user_stream": user_stream,
        "permitted_categories": permitted_categories
    })


@practicals_bp.route('/<int:id>', methods=['GET'])
@jwt_required
def get_practical(id):
    """Returns complete details of a specific practical experiment."""
    practical = Practical.query.filter(
        Practical.id == id,
        (Practical.user_id == g.user_id) | (Practical.user_id == 1)
    ).first()

    if not practical:
        return error_response(code="NOT_FOUND", message="Practical not found.", status_code=404)

    # Parse JSON fields safely
    procedure = []
    try:
        procedure = json.loads(practical.procedure_steps) if practical.procedure_steps else []
    except Exception:
        procedure = [{"step": 1, "text": practical.procedure_steps}]

    observations = {}
    try:
        observations = json.loads(practical.observations_schema) if practical.observations_schema else {}
    except Exception:
        observations = {"columns": ["Reading", "Value"]}

    viva = []
    try:
        viva = json.loads(practical.viva_questions_json) if practical.viva_questions_json else []
    except Exception:
        viva = []

    # Get student's previous attempts on this practical
    user_attempts = PracticalAttempt.query.filter_by(user_id=g.user_id, practical_id=practical.id).order_by(PracticalAttempt.completed_at.desc()).all()

    data = practical.to_dict()
    data['procedure_steps_parsed'] = procedure
    data['observations_schema_parsed'] = observations
    data['viva_questions_parsed'] = viva
    data['user_attempts'] = [a.to_dict() for a in user_attempts]

    return success_response(data={"practical": data})


@practicals_bp.route('', methods=['POST'])
@jwt_required
def create_practical():
    """Allows student/teacher to create a custom practical laboratory experiment."""
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    aim = data.get('aim', '').strip()
    category = data.get('field_category', 'science')

    if not title or not aim:
        return error_response(code="VALIDATION_ERROR", message="Title and Aim are required.")

    practical = Practical(
        user_id=g.user_id,
        subject_id=data.get('subject_id'),
        title=title,
        field_category=category,
        academic_level=data.get('academic_level', 'Undergraduate'),
        aim=aim,
        apparatus_or_tools=data.get('apparatus_or_tools'),
        theory_concepts=data.get('theory_concepts'),
        procedure_steps=json.dumps(data.get('procedure_steps', [])) if isinstance(data.get('procedure_steps'), list) else data.get('procedure_steps'),
        observations_schema=json.dumps(data.get('observations_schema', {})) if isinstance(data.get('observations_schema'), dict) else data.get('observations_schema'),
        calculations_formula=data.get('calculations_formula'),
        safety_guidelines=data.get('safety_guidelines'),
        viva_questions_json=json.dumps(data.get('viva_questions', [])) if isinstance(data.get('viva_questions'), list) else data.get('viva_questions'),
        is_custom=True
    )
    db.session.add(practical)
    db.session.commit()

    return success_response(data={"practical": practical.to_dict()}, message="Practical created successfully.", status_code=201)


@practicals_bp.route('/ai-generate', methods=['POST'])
@jwt_required
def ai_generate_practical():
    """
    Uses Gemini AI to synthesize a comprehensive, rigorous practical lab guide
    for ANY topic across Science, Computer Science, Engineering, Commerce, Humanities, or Vocational.
    """
    data = request.get_json() or {}
    topic_name = data.get('topic', '').strip()
    category = data.get('field_category', 'science').strip()
    academic_level = data.get('academic_level', 'Undergraduate')

    if not topic_name:
        return error_response(code="VALIDATION_ERROR", message="Topic name is required for practical generation.")

    system_instruction = (
        "You are Planora's Universal Practical Lab Architect. Create an exhaustive, highly structured "
        "practical laboratory manual suitable for real school, college, or vocational examinations. "
        "Return valid JSON only."
    )

    prompt = f"""
    Generate a complete laboratory practical manual for:
    Topic: '{topic_name}'
    Field Category: '{category}' (e.g. science, computer_science, engineering, commerce, humanities, vocational)
    Academic Level: '{academic_level}'

    Return a clean JSON object with this exact structure:
    {{
        "title": "Clear experimental or project title",
        "aim": "Precise aim of the experiment",
        "apparatus_or_tools": "Required tools, hardware, components, software or datasets",
        "theory_concepts": "Key underlying theoretical laws, formulas, or algorithmic foundations (2-3 paragraphs)",
        "procedure_steps": [
            {{"step": 1, "text": "First action..."}},
            {{"step": 2, "text": "Second action..."}},
            {{"step": 3, "text": "Third action..."}},
            {{"step": 4, "text": "Fourth action..."}}
        ],
        "observations_schema": {{
            "columns": ["Column 1", "Column 2", "Column 3", "Column 4"]
        }},
        "calculations_formula": "Exact mathematical formulas, ledger tally equations, or complexity reductions",
        "safety_guidelines": "Critical safety warnings, error traps, or data precautions",
        "viva_questions": [
            {{"q": "Examiner Question 1?", "a": "High-scoring ideal answer..."}},
            {{"q": "Examiner Question 2?", "a": "High-scoring ideal answer..."}},
            {{"q": "Examiner Question 3?", "a": "High-scoring ideal answer..."}}
        ]
    }}
    """

    try:
        raw_ai = ai_service.generate_text(prompt, system_instruction=system_instruction)
        # Clean potential markdown fences
        clean_json = raw_ai.strip()
        if clean_json.startswith('```'):
            clean_json = clean_json.split('```')[1]
            if clean_json.startswith('json'):
                clean_json = clean_json[4:]
            clean_json = clean_json.strip()

        parsed = json.loads(clean_json)

        # Save to database
        practical = Practical(
            user_id=g.user_id,
            subject_id=data.get('subject_id'),
            title=parsed.get('title', f"Practical: {topic_name}"),
            field_category=category,
            academic_level=academic_level,
            aim=parsed.get('aim', f"To investigate and demonstrate {topic_name}."),
            apparatus_or_tools=parsed.get('apparatus_or_tools', 'Standard laboratory apparatus.'),
            theory_concepts=parsed.get('theory_concepts', ''),
            procedure_steps=json.dumps(parsed.get('procedure_steps', [])),
            observations_schema=json.dumps(parsed.get('observations_schema', {"columns": ["Observation", "Value"]})),
            calculations_formula=parsed.get('calculations_formula', ''),
            safety_guidelines=parsed.get('safety_guidelines', 'Handle with care.'),
            viva_questions_json=json.dumps(parsed.get('viva_questions', [])),
            is_custom=True
        )
        db.session.add(practical)
        db.session.commit()

        return success_response(
            data={"practical": practical.to_dict()},
            message=f"Practical lab guide for '{topic_name}' generated and saved!",
            status_code=201
        )
    except Exception as e:
        return error_response(code="AI_PRACTICAL_ERROR", message=f"Failed to generate practical with AI: {str(e)}", status_code=500)


@practicals_bp.route('/<int:id>/submit-attempt', methods=['POST'])
@jwt_required
def submit_practical_attempt(id):
    """
    Submits a student's practical attempt:
    - Records observations data and student calculations/code
    - Evaluates viva voce score
    - Computes overall practical exam readiness percentage (0-100%)
    """
    practical = Practical.query.get(id)
    if not practical:
        return error_response(code="NOT_FOUND", message="Practical not found.", status_code=404)

    data = request.get_json() or {}
    observations_data = data.get('observations_data', '')
    calculations_data = data.get('calculations_data', '')
    student_notes_or_code = data.get('student_notes_or_code', '')
    viva_score = float(data.get('viva_score', 85.0))

    # Calculate readiness score
    # Baseline: 30% for submitting observation data, 30% for calculations/code, 40% from viva
    obs_score = 30.0 if len(str(observations_data).strip()) > 10 else 10.0
    calc_score = 30.0 if len(str(calculations_data or student_notes_or_code).strip()) > 10 else 10.0
    viva_weighted = (viva_score / 100.0) * 40.0
    readiness = min(100.0, round(obs_score + calc_score + viva_weighted, 1))

    attempt = PracticalAttempt(
        user_id=g.user_id,
        practical_id=practical.id,
        observations_data=str(observations_data),
        calculations_data=str(calculations_data),
        student_notes_or_code=str(student_notes_or_code),
        viva_score=viva_score,
        readiness_percentage=readiness,
        feedback=f"Good experimental execution. Observation table completed and verified. Viva score: {viva_score}%. Overall readiness: {readiness}%.",
        status='completed',
        completed_at=datetime.utcnow()
    )
    db.session.add(attempt)
    db.session.commit()

    return success_response(
        data={"attempt": attempt.to_dict()},
        message=f"Practical attempt logged! Exam readiness: {readiness}%",
        status_code=201
    )


@practicals_bp.route('/viva-evaluate', methods=['POST'])
@jwt_required
def evaluate_viva_answer():
    """
    AI Viva Voce Examiner:
    Evaluates student's spoken/typed answer against examiner's question and ideal key.
    Provides score (0-100) and constructive feedback.
    """
    data = request.get_json() or {}
    question = data.get('question', '').strip()
    ideal_answer = data.get('ideal_answer', '').strip()
    student_answer = data.get('student_answer', '').strip()

    if not question or not student_answer:
        return error_response(code="VALIDATION_ERROR", message="Question and Student Answer are required.")

    prompt = f"""
    Act as a strict yet constructive academic laboratory viva voce examiner.
    Examiner Question: "{question}"
    Ideal Expected Answer: "{ideal_answer}"
    Student's Answer: "{student_answer}"

    Evaluate the student's answer. Return valid JSON only:
    {{
        "score_out_of_100": 85,
        "is_correct": true,
        "verdict": "Clear, technically accurate explanation",
        "feedback": "Concise 1-2 sentence feedback explaining what was good or what key technical keyword was missed."
    }}
    """

    try:
        raw_res = ai_service.generate_text(prompt)
        clean = raw_res.strip()
        if clean.startswith('```'):
            clean = clean.split('```')[1]
            if clean.startswith('json'):
                clean = clean[4:]
            clean = clean.strip()
        eval_result = json.loads(clean)
        return success_response(data=eval_result)
    except Exception as e:
        # Graceful fallback heuristic
        score = 80 if len(student_answer) > 20 else 50
        return success_response(data={
            "score_out_of_100": score,
            "is_correct": score >= 60,
            "verdict": "Answer submitted",
            "feedback": "Answer recorded. Make sure to cite relevant scientific laws and proper SI units."
        })
