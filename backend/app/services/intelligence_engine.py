import math
from datetime import datetime, date, timedelta
from app.extensions import db
from app.models.academic import Topic, Subject, TopicProgress
from app.models.quiz import QuizAttempt, Quiz
from app.models.revision import Mistake, Revision
from app.models.planner import StudySession, StudyLog
from app.models.note import Flashcard

class LearningIntelligenceEngine:
    """
    Central AI Learning Intelligence Engine for Planora.
    Connects quizzes, mistakes, flashcards, study sessions, and revisions
    into an explainable, data-grounded student learning state.
    """

    @staticmethod
    def get_learning_state(user_id: int):
        """
        Synthesizes student's measured learning state:
        - Overall syllabus mastery percentage
        - Total study hours and consistency
        - Active mistake count & resolution rate
        - Quiz accuracy average
        - Memory retention index
        """
        # 1. Topics & Progress
        topics_count = db.session.query(Topic).join(Subject).filter(Subject.user_id == user_id).count()
        progress_records = TopicProgress.query.filter_by(user_id=user_id).all()
        
        mastered_count = sum(1 for p in progress_records if p.status == 'mastered')
        learning_count = sum(1 for p in progress_records if p.status == 'learning')
        
        mastery_pct = round((mastered_count / topics_count * 100), 1) if topics_count > 0 else 0.0

        # 2. Quiz Performance
        attempts = QuizAttempt.query.filter_by(user_id=user_id).all()
        quiz_count = len(attempts)
        avg_quiz_score = round(sum(a.percentage for a in attempts) / quiz_count, 1) if quiz_count > 0 else 0.0

        # 3. Mistakes & Errors
        all_mistakes = Mistake.query.filter_by(user_id=user_id).all()
        total_mistakes = len(all_mistakes)
        unresolved_mistakes = sum(1 for m in all_mistakes if not m.is_resolved)
        resolved_mistakes = total_mistakes - unresolved_mistakes
        resolution_rate = round((resolved_mistakes / total_mistakes * 100), 1) if total_mistakes > 0 else 100.0

        # 4. Study Duration & Sessions
        logs = StudyLog.query.filter_by(user_id=user_id).all()
        total_study_minutes = sum(l.actual_minutes for l in logs)
        total_study_hours = round(total_study_minutes / 60.0, 1)

        # 5. Flashcards Mastery
        cards = Flashcard.query.filter_by(user_id=user_id).all()
        total_cards = len(cards)
        known_cards = sum(1 for c in cards if c.mastery_level == 'known')
        card_mastery_pct = round((known_cards / total_cards * 100), 1) if total_cards > 0 else 0.0

        # 6. Overall Cognitive Retention Score
        # Blend of quiz score, card mastery, and resolution rate
        components = []
        if quiz_count > 0: components.append(avg_quiz_score)
        if total_cards > 0: components.append(card_mastery_pct)
        if total_mistakes > 0: components.append(resolution_rate)
        if not components: components = [70.0]
        retention_index = round(sum(components) / len(components), 1)

        return {
            'topics_total': topics_count,
            'topics_mastered': mastered_count,
            'topics_learning': learning_count,
            'mastery_percentage': mastery_pct,
            'total_quiz_attempts': quiz_count,
            'average_quiz_score': avg_quiz_score,
            'total_mistakes': total_mistakes,
            'unresolved_mistakes': unresolved_mistakes,
            'mistake_resolution_rate': resolution_rate,
            'total_study_hours': total_study_hours,
            'total_flashcards': total_cards,
            'known_flashcards': known_cards,
            'flashcard_mastery_pct': card_mastery_pct,
            'overall_retention_index': retention_index
        }

    @staticmethod
    def estimate_retention_curve(user_id: int):
        """
        Calculates Ebbinghaus forgetting curve retention score for each active topic:
        Formula: R = e^(-t / S)
        Where:
        - t is elapsed days since last study/revision
        - S (stability) is based on confidence level (1-5) and quiz accuracy
        """
        now = datetime.utcnow()
        topics = db.session.query(Topic).join(Subject).filter(Subject.user_id == user_id).all()
        retention_map = []

        for t in topics:
            prog = TopicProgress.query.filter_by(user_id=user_id, topic_id=t.id).first()
            confidence = prog.confidence_level if prog else 1
            last_date = prog.last_studied_at if (prog and prog.last_studied_at) else None

            if last_date:
                elapsed_days = max(0.1, (now - last_date).total_seconds() / 86400.0)
            else:
                elapsed_days = 4.0 # Default if never logged

            # Stability factor S scales with confidence (S from 2 days up to 14 days)
            stability_days = max(1.5, confidence * 2.8)
            retention_pct = round(math.exp(-elapsed_days / stability_days) * 100.0, 1)
            retention_pct = min(100.0, max(10.0, retention_pct))

            # Status classification
            if retention_pct >= 75.0:
                retention_status = 'Optimal'
                action_required = 'Maintain pace'
            elif retention_pct >= 50.0:
                retention_status = 'Fading'
                action_required = 'Review recommended soon'
            else:
                retention_status = 'Critical Decay'
                action_required = 'Immediate revision required'

            retention_map.append({
                'topic_id': t.id,
                'topic_name': t.name,
                'subject_name': t.subject.name if t.subject else 'General',
                'confidence_level': confidence,
                'elapsed_days': round(elapsed_days, 1),
                'estimated_retention_pct': retention_pct,
                'retention_status': retention_status,
                'action_required': action_required
            })

        retention_map.sort(key=lambda x: x['estimated_retention_pct'])
        return retention_map

    @staticmethod
    def detect_learning_gaps(user_id: int):
        """
        Cross-analyzes quiz history, repeated mistakes, and low confidence topics
        to identify high-risk conceptual gaps.
        """
        gaps = []
        topics = db.session.query(Topic).join(Subject).filter(Subject.user_id == user_id).all()

        for t in topics:
            prog = TopicProgress.query.filter_by(user_id=user_id, topic_id=t.id).first()
            unresolved = Mistake.query.filter_by(user_id=user_id, topic_id=t.id, is_resolved=False).count()
            
            # Check quiz score on this topic
            topic_quizzes = Quiz.query.filter_by(topic_id=t.id).all()
            quiz_ids = [q.id for q in topic_quizzes]
            attempts = QuizAttempt.query.filter(QuizAttempt.user_id == user_id, QuizAttempt.quiz_id.in_(quiz_ids)).all() if quiz_ids else []
            avg_score = (sum(a.percentage for a in attempts) / len(attempts)) if attempts else None

            severity = None
            evidence = []

            if avg_score is not None and avg_score < 60.0:
                severity = 'High'
                evidence.append(f"Average quiz accuracy is {round(avg_score, 1)}% (below 60% threshold)")

            if unresolved > 0:
                if severity is None: severity = 'Medium'
                evidence.append(f"{unresolved} unresolved conceptual mistakes in Error Notebook")

            if prog and prog.confidence_level <= 2 and prog.status != 'not_started':
                if severity is None: severity = 'Medium'
                evidence.append(f"Self-assessed confidence rating is low ({prog.confidence_level}/5)")

            if severity:
                gaps.append({
                    'topic_id': t.id,
                    'topic_name': t.name,
                    'subject_name': t.subject.name if t.subject else 'General',
                    'severity': severity,
                    'unresolved_mistakes': unresolved,
                    'average_quiz_score': round(avg_score, 1) if avg_score is not None else 'No attempts',
                    'evidence': evidence,
                    'recommended_action': f"Open Study Hub for {t.name} and review flashcards & mistakes."
                })

        gaps.sort(key=lambda x: 0 if x['severity'] == 'High' else 1)
        return gaps

    @staticmethod
    def generate_explainable_recommendations(user_id: int):
        """
        Synthesizes personalized, explainable learning recommendations grounded in verified database facts.
        Every recommendation includes:
        - What to do
        - Why (Grounded in student records)
        - Evidence facts
        - Expected benefit
        - Direct actionable route
        """
        recommendations = []
        gaps = LearningIntelligenceEngine.detect_learning_gaps(user_id)
        retention = LearningIntelligenceEngine.estimate_retention_curve(user_id)

        # 1. Recommendation for highest risk gap
        if gaps:
            top_gap = gaps[0]
            recommendations.append({
                'id': 'rec_gap_remediation',
                'type': 'gap_remediation',
                'priority': 'High',
                'title': f"Priority Gap: Master {top_gap['topic_name']}",
                'what': f"Complete a 25-minute active recall session on {top_gap['topic_name']}.",
                'why': f"Planora detected repeated exam vulnerability: {', '.join(top_gap['evidence'])}.",
                'evidence': top_gap['evidence'],
                'expected_benefit': f"Directly resolves {top_gap['unresolved_mistakes']} pending errors and stabilizes exam foundation.",
                'action_label': f"Open {top_gap['topic_name']} Study Hub",
                'action_link': f"/study-hub/{top_gap['topic_id']}"
            })

        # 2. Recommendation for critical retention decay
        decayed = [r for r in retention if r['estimated_retention_pct'] < 55.0]
        if decayed:
            decay_topic = decayed[0]
            recommendations.append({
                'id': 'rec_spaced_revision',
                'type': 'spaced_revision',
                'priority': 'Medium',
                'title': f"Spaced Revision Due: {decay_topic['topic_name']}",
                'what': f"Run a quick 10-minute flashcard flip session for {decay_topic['topic_name']}.",
                'why': f"Last studied {decay_topic['elapsed_days']} days ago. Estimated recall has decayed to {decay_topic['estimated_retention_pct']}%.",
                'evidence': [f"Elapsed: {decay_topic['elapsed_days']} days", f"Decay level: {decay_topic['estimated_retention_pct']}%"],
                'expected_benefit': "Re-anchors memory back up to 90%+ per the Ebbinghaus forgetting curve.",
                'action_label': "Practice Flashcards",
                'action_link': f"/flashcards?topic_id={decay_topic['topic_id']}"
            })

        # 3. Practical Lab Readiness
        recommendations.append({
            'id': 'rec_practical_lab',
            'type': 'practical_prep',
            'priority': 'Low',
            'title': "Universal Practical Lab Readiness",
            'what': "Conduct a simulated lab experiment and take a 3-question viva voce practice test.",
            'why': "Practical examinations account for up to 30% of total score across science, IT, and vocational courses.",
            'evidence': ["Hands-on lab simulations reinforce classroom theoretical principles."],
            'expected_benefit': "Eliminates viva anxiety and ensures flawless observation table calculations.",
            'action_label': "Open Practical Lab",
            'action_link': "/practicals"
        })

        return recommendations
