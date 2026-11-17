from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from app.extensions import db
from app.models.revision import Revision, Mistake
from app.models.academic import Topic, TopicProgress

class RevisionService:
    """
    Spaced Repetition System (SRS).
    Manages automated scheduling across adaptive intervals (1, 3, 7, 15, 30 days).
    """

    INTERVALS = [1, 3, 7, 15, 30]

    @staticmethod
    def schedule_initial_revisions(user_id: int, topic_id: int, study_date: Optional[date] = None):
        """
        When a student completes a study session or quiz for a topic,
        queue up spaced repetition tasks.
        """
        if not study_date:
            study_date = date.today()

        # Check existing revisions to avoid duplicate clutter
        existing = Revision.query.filter_by(user_id=user_id, topic_id=topic_id).all()
        existing_intervals = {r.interval_day for r in existing}

        for interval in RevisionService.INTERVALS:
            if interval not in existing_intervals:
                target_date = study_date + timedelta(days=interval)
                rev = Revision(
                    user_id=user_id,
                    topic_id=topic_id,
                    interval_day=interval,
                    scheduled_date=target_date,
                    status='pending'
                )
                db.session.add(rev)

        db.session.commit()

    @staticmethod
    def complete_revision(revision_id: int, user_id: int, score: float = 100.0) -> Revision:
        """
        Record revision completion, score, and adapt future intervals.
        """
        rev = Revision.query.filter_by(id=revision_id, user_id=user_id).first()
        if not rev:
            raise ValueError("Revision entry not found.")

        rev.status = 'completed'
        rev.performance_score = score
        rev.completed_at = datetime.utcnow()

        # Adaptive interval adjustment:
        # If performance was poor (< 60%), schedule a quick remedial revision in 1 day
        if score < 60.0:
            remedial_date = date.today() + timedelta(days=1)
            remedial_rev = Revision(
                user_id=user_id,
                topic_id=rev.topic_id,
                interval_day=1,
                scheduled_date=remedial_date,
                status='pending'
            )
            db.session.add(remedial_rev)

        # Update topic progress confidence
        prog = TopicProgress.query.filter_by(user_id=user_id, topic_id=rev.topic_id).first()
        if prog:
            if score >= 80:
                prog.confidence_level = min(5, prog.confidence_level + 1)
                prog.status = 'mastered'
            elif score < 60:
                prog.confidence_level = max(1, prog.confidence_level - 1)
                prog.status = 'needs_revision'

        db.session.commit()
        return rev

    @staticmethod
    def get_due_revisions(user_id: int) -> List[Dict[str, Any]]:
        """
        Get revisions due today or overdue.
        """
        today = date.today()
        due = Revision.query.filter(
            Revision.user_id == user_id,
            Revision.status == 'pending',
            Revision.scheduled_date <= today
        ).order_by(Revision.scheduled_date.asc()).all()

        return [r.to_dict() for r in due]
