import urllib.parse
from flask import Blueprint, request, g
from app.extensions import db
from app.models.academic import Topic, Subject, TopicProgress
from app.models.ai import StudyMemory
from app.models.note import Note, Flashcard
from app.models.quiz import Quiz
from app.models.revision import Mistake
from app.services.gap_detector import KnowledgeGapDetector
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

study_bp = Blueprint('study', __name__, url_prefix='/api/study')

@study_bp.route('/memory', methods=['GET'])
@jwt_required
def get_study_memory():
    # Return latest active memory
    memory = StudyMemory.query.filter_by(user_id=g.user_id).order_by(StudyMemory.updated_at.desc()).first()
    return success_response(data={"memory": memory.to_dict() if memory else None})

@study_bp.route('/memory', methods=['POST'])
@jwt_required
def set_study_memory():
    data = request.get_json() or {}
    topic_id = data.get('topic_id')
    subject_id = data.get('subject_id')
    chapter = data.get('chapter')
    last_position = data.get('last_position', 'Page 1')
    last_activity = data.get('last_activity', 'Studying concepts')

    if not topic_id:
        return error_response(code="VALIDATION_ERROR", message="Topic ID is required.")

    topic = Topic.query.get(topic_id)
    if not topic:
        return error_response(code="NOT_FOUND", message="Topic not found.", status_code=404)

    memory = StudyMemory.query.filter_by(user_id=g.user_id, topic_id=topic_id).first()
    if not memory:
        memory = StudyMemory(
            user_id=g.user_id,
            subject_id=subject_id or topic.subject_id,
            topic_id=topic_id
        )
        db.session.add(memory)

    memory.chapter = chapter or topic.chapter
    memory.last_position = last_position
    memory.last_activity = last_activity
    db.session.commit()

    return success_response(data={"memory": memory.to_dict()}, message="Study memory saved.")

@study_bp.route('/universe', methods=['GET'])
@jwt_required
def get_knowledge_universe():
    """
    Returns visual topic map data for the Knowledge Universe.
    Nodes have visual states: 'completed', 'learning', 'weak', 'locked', 'upcoming'.
    """
    subjects = Subject.query.filter_by(user_id=g.user_id).all()
    gaps_list = KnowledgeGapDetector.analyze_user_gaps(g.user_id)
    gap_map = {g['topic_id']: g['gap_level'] for g in gaps_list}

    nodes = []
    links = []

    for sub in subjects:
        # Subject master node
        sub_node_id = f"sub_{sub.id}"
        nodes.append({
            "id": sub_node_id,
            "label": sub.name,
            "type": "subject",
            "color": sub.color,
            "status": "active"
        })

        topics = Topic.query.filter_by(subject_id=sub.id).order_by(Topic.order_index).all()
        for t in topics:
            t_node_id = f"topic_{t.id}"
            prog = TopicProgress.query.filter_by(user_id=g.user_id, topic_id=t.id).first()

            status = "upcoming"
            if prog:
                if prog.status == 'mastered':
                    status = "completed"
                elif prog.status == 'learning':
                    status = "learning"
                elif prog.status == 'needs_revision':
                    status = "weak"

            # Check if weak according to gap engine
            if gap_map.get(t.id) == "HIGH":
                status = "weak"

            # Check if prerequisites completed; if not, locked
            for prereq in t.prerequisites:
                p_prog = TopicProgress.query.filter_by(user_id=g.user_id, topic_id=prereq.id).first()
                if not p_prog or p_prog.status != 'mastered':
                    if status != 'completed':
                        status = "locked"

            nodes.append({
                "id": t_node_id,
                "label": t.name,
                "type": "topic",
                "subject_id": sub.id,
                "subject_name": sub.name,
                "color": sub.color,
                "chapter": t.chapter,
                "difficulty": t.difficulty,
                "status": status, # completed, learning, weak, locked, upcoming
                "confidence": prog.confidence_level if prog else 1
            })

            # Connect topic to subject
            links.append({"source": sub_node_id, "target": t_node_id, "type": "belongs_to"})

            # Connect prerequisites
            for prereq in t.prerequisites:
                links.append({"source": f"topic_{prereq.id}", "target": t_node_id, "type": "prerequisite"})

    return success_response(data={"nodes": nodes, "links": links})

@study_bp.route('/path', methods=['GET'])
@jwt_required
def get_learning_path():
    """
    Recommends: 'Study this next' based on:
    - High knowledge gaps
    - Prerequisites
    - Exam proximity
    """
    gaps = KnowledgeGapDetector.analyze_user_gaps(g.user_id)
    high_gaps = [g for g in gaps if g['gap_level'] == 'HIGH']

    if high_gaps:
        top_rec = high_gaps[0]
        topic = Topic.query.get(top_rec['topic_id'])
        # Check if topic has unmastered prerequisites
        unmastered_prereq = None
        for prereq in topic.prerequisites:
            prog = TopicProgress.query.filter_by(user_id=g.user_id, topic_id=prereq.id).first()
            if not prog or prog.status != 'mastered':
                unmastered_prereq = prereq
                break

        if unmastered_prereq:
            reason = f"You should revise '{unmastered_prereq.name}' before continuing with '{topic.name}'."
            rec_topic = unmastered_prereq
        else:
            reason = f"High knowledge gap detected ({top_rec['gap_score']}% risk). Address this to secure target score."
            rec_topic = topic
    else:
        # Find next unstarted or learning topic
        prog_sub = TopicProgress.query.filter_by(user_id=g.user_id, status='learning').first()
        if prog_sub:
            rec_topic = prog_sub.topic
            reason = "Continue your active learning track."
        else:
            rec_topic = Topic.query.join(Subject).filter(Subject.user_id == g.user_id).first()
            reason = "Start this foundational topic to begin your curriculum."

    if not rec_topic:
        return success_response(data={"recommendation": None, "message": "No topics available yet. Please complete onboarding."})

    return success_response(data={
        "recommendation": {
            "topic_id": rec_topic.id,
            "topic_name": rec_topic.name,
            "subject_name": rec_topic.subject.name if rec_topic.subject else "",
            "subject_color": rec_topic.subject.color if rec_topic.subject else "#6366f1",
            "reason": reason
        }
    })

@study_bp.route('/hub/<int:topic_id>', methods=['GET'])
@jwt_required
def get_study_hub_data(topic_id):
    """
    Returns complete data for the central Study Hub screen:
    - Topic metadata
    - Notes
    - Flashcards
    - Available Quizzes
    - Unresolved mistakes
    - YouTube recommendation search link
    """
    topic = Topic.query.get(topic_id)
    if not topic or (topic.subject and topic.subject.user_id != g.user_id):
        return error_response(code="NOT_FOUND", message="Topic not found.", status_code=404)

    notes = Note.query.filter_by(user_id=g.user_id, topic_id=topic_id).all()
    flashcards = Flashcard.query.filter_by(user_id=g.user_id, topic_id=topic_id).all()
    quizzes = Quiz.query.filter_by(user_id=g.user_id, topic_id=topic_id).all()
    mistakes = Mistake.query.filter_by(user_id=g.user_id, topic_id=topic_id, is_resolved=False).all()

    # Video recommendations fallback / query generator
    yt_query = urllib.parse.quote(f"{topic.subject.name} {topic.name} full explanation tutorial")
    recommended_videos = [
        {
            "title": f"Mastering {topic.name} ({topic.subject.name})",
            "channel": "Exam Coach Educational Series",
            "url": f"https://www.youtube.com/results?search_query={yt_query}",
            "type": "Concept Masterclass"
        },
        {
            "title": f"Top 10 Exam Questions on {topic.name}",
            "channel": "High-Yield STEM Tutorials",
            "url": f"https://www.youtube.com/results?search_query={yt_query}+previous+year+questions",
            "type": "Previous Year Questions"
        }
    ]

    return success_response(data={
        "topic": topic.to_dict(user_id=g.user_id),
        "notes": [n.to_dict() for n in notes],
        "flashcards": [f.to_dict() for f in flashcards],
        "quizzes": [q.to_dict() for q in quizzes],
        "mistakes": [m.to_dict() for m in mistakes],
        "recommended_videos": recommended_videos
    })
