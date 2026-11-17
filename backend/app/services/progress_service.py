from datetime import datetime, date, timedelta
from typing import Dict, Any, List
from sqlalchemy import func
from app.extensions import db
from app.models.user import User, StudentProfile
from app.models.academic import Subject, Topic, TopicProgress
from app.models.planner import StudySession, StudyLog
from app.models.quiz import QuizAttempt
from app.models.revision import Revision
from app.services.gap_detector import KnowledgeGapDetector

class ProgressService:
    """
    Analytics and Exam Readiness calculation engine.
    Derives all statistics directly from database records.
    """

    @staticmethod
    def get_dashboard_summary(user_id: int) -> Dict[str, Any]:
        user = User.query.get(user_id)
        if not user:
            return {}

        today = date.today()

        # Total study hours from study_logs
        total_minutes = db.session.query(func.coalesce(func.sum(StudyLog.actual_minutes), 0))\
            .filter(StudyLog.user_id == user_id).scalar()
        total_hours = round(float(total_minutes) / 60.0, 1)

        # Completed sessions count
        completed_sessions = StudySession.query.filter_by(user_id=user_id, status='completed').count()

        # Average Quiz Score
        avg_quiz = db.session.query(func.avg(QuizAttempt.percentage))\
            .filter(QuizAttempt.user_id == user_id).scalar()
        avg_quiz_score = round(float(avg_quiz), 1) if avg_quiz is not None else 0.0

        # Exam Countdown
        profile = StudentProfile.query.filter_by(user_id=user_id).first()
        days_to_exam = None
        exam_target_name = "Board Examination"
        if profile and profile.exam_date:
            delta = (profile.exam_date - today).days
            days_to_exam = max(0, delta)
            if profile.study_goal:
                exam_target_name = profile.study_goal

        # Today's Mission & Upcoming Session
        now = datetime.utcnow()
        start_of_day = datetime(today.year, today.month, today.day, 0, 0, 0)
        end_of_day = datetime(today.year, today.month, today.day, 23, 59, 59)

        today_sessions = StudySession.query.filter(
            StudySession.user_id == user_id,
            StudySession.scheduled_start >= start_of_day,
            StudySession.scheduled_start <= end_of_day
        ).order_by(StudySession.scheduled_start.asc()).all()

        todays_mission = None
        upcoming_session = None

        for s in today_sessions:
            if s.status in ['scheduled', 'in_progress'] and not todays_mission:
                todays_mission = s.to_dict()
            elif s.status == 'scheduled' and not upcoming_session:
                upcoming_session = s.to_dict()

        if not todays_mission and today_sessions:
            todays_mission = today_sessions[0].to_dict()

        # Knowledge Gaps calculation
        gaps = KnowledgeGapDetector.analyze_user_gaps(user_id)
        high_gaps = [g for g in gaps if g['gap_level'] == 'HIGH']
        top_weak_topic = high_gaps[0] if high_gaps else (gaps[0] if gaps else None)

        ai_insight = "Keep up your consistent study rhythm! Check today's schedule to begin your missions."
        if top_weak_topic:
            ai_insight = f"Your performance telemetry shows that '{top_weak_topic['topic_name']}' has a high knowledge gap ({top_weak_topic['gap_score']}% risk). We recommend prioritizing revision before exams."

        # Exam Readiness calculation
        readiness = ProgressService.calculate_exam_readiness(user_id)

        return {
            "streak": user.streak,
            "xp": user.xp,
            "total_study_hours": total_hours,
            "completed_sessions_count": completed_sessions,
            "average_quiz_score": avg_quiz_score,
            "exam_countdown": {
                "days_left": days_to_exam,
                "target_name": exam_target_name,
                "exam_date": profile.exam_date.isoformat() if profile and profile.exam_date else None
            },
            "todays_mission": todays_mission,
            "upcoming_session": upcoming_session,
            "ai_insight": ai_insight,
            "exam_readiness": readiness,
            "knowledge_gaps_summary": {
                "high_count": len([g for g in gaps if g['gap_level'] == 'HIGH']),
                "medium_count": len([g for g in gaps if g['gap_level'] == 'MEDIUM']),
                "low_count": len([g for g in gaps if g['gap_level'] == 'LOW'])
            }
        }

    @staticmethod
    def calculate_exam_readiness(user_id: int) -> Dict[str, Any]:
        """
        Calculates exam preparation readiness % based on:
        - Syllabus completion (35%)
        - Spaced revision completion (25%)
        - Quiz mastery (25%)
        - Study consistency (15%)
        """
        # 1. Syllabus completion
        total_topics = Topic.query.join(Subject).filter(Subject.user_id == user_id).count()
        mastered_topics = TopicProgress.query.filter_by(user_id=user_id, status='mastered').count()
        learning_topics = TopicProgress.query.filter_by(user_id=user_id, status='learning').count()
        
        syllabus_pct = 0.0
        if total_topics > 0:
            effective_done = mastered_topics + (learning_topics * 0.5)
            syllabus_pct = min(100.0, round((effective_done / total_topics) * 100.0, 1))

        # 2. Revision completion
        total_revs = Revision.query.filter_by(user_id=user_id).count()
        done_revs = Revision.query.filter_by(user_id=user_id, status='completed').count()
        revision_pct = round((done_revs / total_revs * 100.0), 1) if total_revs > 0 else 50.0

        # 3. Quiz mastery
        avg_quiz = db.session.query(func.avg(QuizAttempt.percentage)).filter_by(user_id=user_id).scalar()
        quiz_pct = round(float(avg_quiz), 1) if avg_quiz is not None else 60.0

        # 4. Consistency (streak & sessions)
        user = User.query.get(user_id)
        streak = user.streak if user else 0
        consistency_pct = min(100.0, (streak * 10.0) + 30.0)

        # Weighted Readiness
        overall_readiness = round(
            (0.35 * syllabus_pct) +
            (0.25 * revision_pct) +
            (0.25 * quiz_pct) +
            (0.15 * consistency_pct),
            1
        )
        overall_readiness = min(100.0, max(0.0, overall_readiness))

        return {
            "readiness_percentage": overall_readiness,
            "components": {
                "syllabus_completion": syllabus_pct,
                "revision_completion": revision_pct,
                "quiz_mastery": quiz_pct,
                "study_consistency": consistency_pct
            },
            "interpretation": (
                "Excellent Readiness - On track for target performance" if overall_readiness >= 80 else
                "Moderate Readiness - Consistent revision required on weaker topics" if overall_readiness >= 50 else
                "Early Stage Preparation - Build study habit and complete fundamental chapters"
            )
        }

    @staticmethod
    def get_full_analytics(user_id: int) -> Dict[str, Any]:
        """
        Provides detailed charting data:
        - Weekly study hours (last 7 days)
        - Subject progress breakdown
        - Quiz scores timeline
        - Knowledge gaps
        """
        today = date.today()
        # 1. Weekly hours (last 7 days)
        days_labels = []
        hours_values = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            days_labels.append(d.strftime('%a')) # Mon, Tue, etc.
            start_d = datetime(d.year, d.month, d.day, 0, 0, 0)
            end_d = datetime(d.year, d.month, d.day, 23, 59, 59)
            daily_mins = db.session.query(func.coalesce(func.sum(StudyLog.actual_minutes), 0))\
                .filter(StudyLog.user_id == user_id, StudyLog.completed_at >= start_d, StudyLog.completed_at <= end_d)\
                .scalar()
            hours_values.append(round(float(daily_mins) / 60.0, 2))

        # 2. Subject progress
        subjects = Subject.query.filter_by(user_id=user_id).all()
        subject_progress = []
        for s in subjects:
            top_count = len(s.topics)
            mastered = 0
            if top_count > 0:
                top_ids = [t.id for t in s.topics]
                mastered = TopicProgress.query.filter(
                    TopicProgress.user_id == user_id,
                    TopicProgress.topic_id.in_(top_ids),
                    TopicProgress.status == 'mastered'
                ).count()
            pct = round((mastered / top_count * 100.0), 1) if top_count > 0 else 0.0
            subject_progress.append({
                "subject_id": s.id,
                "name": s.name,
                "color": s.color,
                "total_topics": top_count,
                "mastered_topics": mastered,
                "percentage": pct
            })

        # 3. Quiz performance timeline (last 10 attempts)
        attempts = QuizAttempt.query.filter_by(user_id=user_id).order_by(QuizAttempt.completed_at.asc()).limit(10).all()
        quiz_timeline = [{
            "id": a.id,
            "title": a.quiz.title if a.quiz else "Quiz",
            "score": a.score,
            "total": a.total_questions,
            "percentage": float(a.percentage),
            "date": a.completed_at.strftime('%b %d')
        } for a in attempts]

        return {
            "weekly_study": {
                "labels": days_labels,
                "data": hours_values
            },
            "subject_progress": subject_progress,
            "quiz_timeline": quiz_timeline,
            "readiness": ProgressService.calculate_exam_readiness(user_id),
            "knowledge_gaps": KnowledgeGapDetector.analyze_user_gaps(user_id)
        }
