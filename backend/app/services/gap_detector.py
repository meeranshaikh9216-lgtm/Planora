from typing import List, Dict, Any
from app.models.academic import Topic, TopicProgress, Subject
from app.models.quiz import QuizAttempt, QuizAnswer, QuizQuestion
from app.models.revision import Mistake, Revision

class KnowledgeGapDetector:
    """
    Mathematical Knowledge Gap Analysis Engine.
    Grounds all weakness evaluations strictly in user performance data:
    - Quiz accuracy
    - Active unresolved mistakes
    - User confidence ratings
    - Overdue / missed revisions
    """

    @staticmethod
    def analyze_user_gaps(user_id: int, subject_id: int = None) -> List[Dict[str, Any]]:
        """
        Calculates gap scores (0 to 100) and classifications (HIGH, MEDIUM, LOW)
        across topics for a given user.
        """
        query = Topic.query
        if subject_id:
            query = query.filter_by(subject_id=subject_id)
        topics = query.all()

        results = []

        for topic in topics:
            # 1. Topic Progress metrics
            prog = TopicProgress.query.filter_by(user_id=user_id, topic_id=topic.id).first()
            confidence = prog.confidence_level if prog else 2 # default 2/5
            avg_quiz_score = float(prog.average_quiz_score) if prog and prog.average_quiz_score is not None else None

            # 2. Mistake Bank metrics
            unresolved_mistakes = Mistake.query.filter_by(
                user_id=user_id,
                topic_id=topic.id,
                is_resolved=False
            ).all()
            mistake_count = len(unresolved_mistakes)
            repeated_mistakes = sum(1 for m in unresolved_mistakes if m.recurrence_count > 1)

            # 3. Revision performance
            pending_revisions = Revision.query.filter(
                Revision.user_id == user_id,
                Revision.topic_id == topic.id,
                Revision.status == 'pending'
            ).count()

            # GAP CALCULATION ALGORITHM:
            # Base risk starts at 20
            gap_score = 20.0

            # Factor A: Quiz Performance (up to +45 risk if score is low, -20 if high)
            if avg_quiz_score is not None:
                if avg_quiz_score < 50:
                    gap_score += 40.0
                elif avg_quiz_score < 70:
                    gap_score += 25.0
                elif avg_quiz_score < 85:
                    gap_score += 10.0
                else:
                    gap_score -= 15.0

            # Factor B: Unresolved Mistakes (+12 per mistake, extra for repeated)
            gap_score += min(35.0, (mistake_count * 12.0) + (repeated_mistakes * 8.0))

            # Factor C: Confidence Level penalty (confidence 1 adds 15, confidence 5 subtracts 15)
            gap_score += (3 - confidence) * 6.0

            # Factor D: Delinquent revisions
            if pending_revisions > 0:
                gap_score += min(15.0, pending_revisions * 5.0)

            # Clamp between 0 and 100
            gap_score = max(0.0, min(100.0, round(gap_score, 1)))

            # Classification
            if gap_score >= 65.0:
                gap_level = "HIGH"
                recommendation = f"Immediate focused revision and practice needed for {topic.name}. Review mistakes in Mistake Bank."
            elif gap_score >= 38.0:
                gap_level = "MEDIUM"
                recommendation = f"Moderate gap in {topic.name}. Take a refresher quiz and consolidate formulas."
            else:
                gap_level = "LOW"
                recommendation = f"Solid foundation in {topic.name}. Maintain spaced repetition to retain mastery."

            results.append({
                "topic_id": topic.id,
                "topic_name": topic.name,
                "subject_id": topic.subject_id,
                "subject_name": topic.subject.name if topic.subject else "",
                "subject_color": topic.subject.color if topic.subject else "#6366f1",
                "gap_score": gap_score,
                "gap_level": gap_level,
                "metrics": {
                    "avg_quiz_score": avg_quiz_score,
                    "unresolved_mistakes": mistake_count,
                    "repeated_mistakes": repeated_mistakes,
                    "confidence_level": confidence,
                    "pending_revisions": pending_revisions
                },
                "recommendation": recommendation
            })

        # Sort highest gap first
        results.sort(key=lambda x: x["gap_score"], reverse=True)
        return results
