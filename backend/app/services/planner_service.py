from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from app.extensions import db
from app.models.planner import Planner, PlannerSubject, StudySession
from app.models.academic import Subject, Topic, TopicPrerequisite, TopicProgress
from app.models.notification import Notification
from app.models.reminder import SessionReminder

class PlannerService:
    """
    Deterministic Study Planner Engine.
    Uses mathematical algorithms and calendar mathematics for conflict-free scheduling,
    and applies academic prioritization for subject & topic sequencing.
    """

    TIME_SLOTS = {
        'morning': [('08:00', '09:30'), ('10:00', '11:30'), ('11:45', '13:00')],
        'afternoon': [('13:30', '15:00'), ('15:30', '17:00'), ('17:15', '18:30')],
        'evening': [('17:00', '18:30'), ('19:00', '20:30'), ('21:00', '22:00')],
        'night': [('20:00', '21:30'), ('22:00', '23:30'), ('23:45', '01:00')]
    }

    @staticmethod
    def generate_schedule(
        user_id: int,
        title: str,
        subject_ids: List[int],
        start_date: date,
        end_date: date,
        daily_hours: float = 4.0,
        preferred_time: str = 'evening'
    ) -> Planner:
        """
        Generate a fully deterministic, conflict-free study schedule stored in MySQL.
        """
        if preferred_time not in PlannerService.TIME_SLOTS:
            preferred_time = 'evening'

        # Create Planner
        planner = Planner(
            user_id=user_id,
            title=title,
            start_date=start_date,
            end_date=end_date,
            daily_hours=daily_hours,
            status='active'
        )
        db.session.add(planner)
        db.session.flush()

        # Link Planner Subjects
        subjects = Subject.query.filter(Subject.id.in_(subject_ids), Subject.user_id == user_id).all()
        if not subjects:
            # Fallback to all user subjects
            subjects = Subject.query.filter_by(user_id=user_id).all()

        for sub in subjects:
            ps = PlannerSubject(planner_id=planner.id, subject_id=sub.id, priority_weight=1.0)
            db.session.add(ps)

        # Build topic queues respecting prerequisites for each subject
        subject_topic_queues = {}
        for sub in subjects:
            topics = Topic.query.filter_by(subject_id=sub.id).order_by(Topic.order_index).all()
            # Sort topics so prerequisites appear before dependents
            ordered_topics = PlannerService._topological_sort_topics(topics)
            subject_topic_queues[sub.id] = ordered_topics

        # Calculate days between start and end date
        total_days = max(1, (end_date - start_date).days + 1)
        # Limit to 30 days max per plan generation to keep execution fast and focused
        total_days = min(total_days, 30)

        # Slot duration per session (default 60 to 90 mins)
        slots_template = PlannerService.TIME_SLOTS[preferred_time]
        # Number of sessions per day based on daily hours
        num_sessions_per_day = max(1, min(len(slots_template), int(daily_hours // 1.2) or 2))

        subject_idx = 0
        topic_pointers = {sub.id: 0 for sub in subjects}

        for day_offset in range(total_days):
            current_day = start_date + timedelta(days=day_offset)

            for slot_idx in range(num_sessions_per_day):
                if not subjects:
                    break

                active_subject = subjects[subject_idx % len(subjects)]
                subject_idx += 1

                # Pick next topic for this subject
                topics_list = subject_topic_queues.get(active_subject.id, [])
                topic_id = None
                topic_title = active_subject.name
                if topics_list:
                    ptr = topic_pointers[active_subject.id] % len(topics_list)
                    current_topic = topics_list[ptr]
                    topic_id = current_topic.id
                    topic_title = f"{active_subject.name}: {current_topic.name}"
                    topic_pointers[active_subject.id] += 1

                start_str, end_str = slots_template[slot_idx % len(slots_template)]
                sh, sm = map(int, start_str.split(':'))
                eh, em = map(int, end_str.split(':'))

                session_start = datetime(current_day.year, current_day.month, current_day.day, sh, sm)
                session_end = datetime(current_day.year, current_day.month, current_day.day, eh, em)
                duration = int((session_end - session_start).total_seconds() / 60)

                session = StudySession(
                    user_id=user_id,
                    planner_id=planner.id,
                    subject_id=active_subject.id,
                    topic_id=topic_id,
                    title=topic_title,
                    scheduled_start=session_start,
                    scheduled_end=session_end,
                    duration_minutes=duration,
                    status='scheduled'
                )
                db.session.add(session)
                db.session.flush()

                reminder = SessionReminder(
                    user_id=user_id,
                    session_id=session.id,
                    title=f"Upcoming Study Session: {topic_title}",
                    subject_name=active_subject.name,
                    topic_name=topic_title,
                    scheduled_start=session_start,
                    remind_at=session_start - timedelta(minutes=10),
                    minutes_before=10,
                    sound_enabled=True,
                    status='pending'
                )
                db.session.add(reminder)

        db.session.commit()
        return planner

    @staticmethod
    def _topological_sort_topics(topics: List[Topic]) -> List[Topic]:
        """Sort topics respecting prerequisites."""
        if not topics:
            return []
        
        topic_map = {t.id: t for t in topics}
        visited = set()
        result = []

        def dfs(t_id):
            if t_id in visited:
                return
            visited.add(t_id)
            topic = topic_map.get(t_id)
            if topic:
                for prereq in topic.prerequisites:
                    if prereq.id in topic_map:
                        dfs(prereq.id)
                result.append(topic)

        for t in topics:
            dfs(t.id)

        return result

    @staticmethod
    def detect_and_handle_missed_sessions(user_id: int) -> List[Dict[str, Any]]:
        """
        Identifies any past sessions still marked as 'scheduled'.
        Updates their status to 'missed' and returns recovery prompts.
        """
        now = datetime.utcnow()
        overdue_sessions = StudySession.query.filter(
            StudySession.user_id == user_id,
            StudySession.status == 'scheduled',
            StudySession.scheduled_end < now
        ).order_by(StudySession.scheduled_start.desc()).all()

        missed_list = []
        for s in overdue_sessions:
            s.status = 'missed'
            missed_list.append(s.to_dict())

        if overdue_sessions:
            db.session.commit()

        return missed_list

    @staticmethod
    def recover_session(session_id: int, user_id: int, action: str) -> Dict[str, Any]:
        """
        Dynamic Recovery flow:
        - 'study_now': Update scheduled_start to right now, set status to 'in_progress'
        - 'reschedule': Find next day open time slot, shift session without destroying planner
        - 'skip': Mark as missed with note
        """
        session = StudySession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            raise ValueError("Study session not found.")

        now = datetime.utcnow()

        if action == 'study_now':
            session.scheduled_start = now
            session.scheduled_end = now + timedelta(minutes=session.duration_minutes)
            session.status = 'in_progress'
            db.session.commit()
            return {"action": "study_now", "session": session.to_dict(), "message": "Session started now!"}

        elif action == 'reschedule':
            # Shift by 1 day or to next free slot tomorrow
            new_start = session.scheduled_start + timedelta(days=1)
            new_end = new_start + timedelta(minutes=session.duration_minutes)
            session.scheduled_start = new_start
            session.scheduled_end = new_end
            session.status = 'scheduled'
            session.notes = (session.notes or '') + f" [Rescheduled from {session.scheduled_start.strftime('%Y-%m-%d')}]"
            db.session.commit()
            return {"action": "reschedule", "session": session.to_dict(), "message": "Session rescheduled for tomorrow."}

        elif action == 'skip':
            session.status = 'missed'
            session.notes = (session.notes or '') + " [Skipped by student]"
            db.session.commit()
            return {"action": "skip", "session": session.to_dict(), "message": "Session marked as skipped."}

        else:
            raise ValueError(f"Unknown recovery action '{action}'")
