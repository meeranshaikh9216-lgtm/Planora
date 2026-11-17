from datetime import datetime
from app.extensions import db

class Planner(db.Model):
    __tablename__ = 'planners'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    daily_hours = db.Column(db.Numeric(3, 1), default=4.0)
    status = db.Column(db.String(30), default='active') # active, completed, archived
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    planner_subjects = db.relationship('PlannerSubject', backref='planner', cascade='all, delete-orphan')
    sessions = db.relationship('StudySession', backref='planner', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'daily_hours': float(self.daily_hours) if self.daily_hours is not None else 4.0,
            'status': self.status,
            'total_sessions': len(self.sessions),
            'completed_sessions': sum(1 for s in self.sessions if s.status == 'completed'),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class PlannerSubject(db.Model):
    __tablename__ = 'planner_subjects'

    id = db.Column(db.Integer, primary_key=True)
    planner_id = db.Column(db.Integer, db.ForeignKey('planners.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    priority_weight = db.Column(db.Numeric(3, 2), default=1.0)

    __table_args__ = (
        db.UniqueConstraint('planner_id', 'subject_id', name='uq_planner_subject'),
    )

class StudySession(db.Model):
    __tablename__ = 'study_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    planner_id = db.Column(db.Integer, db.ForeignKey('planners.id', ondelete='SET NULL'), nullable=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id', ondelete='SET NULL'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    scheduled_start = db.Column(db.DateTime, nullable=False, index=True)
    scheduled_end = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)
    status = db.Column(db.String(30), default='scheduled') # scheduled, in_progress, completed, missed, rescheduled
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to topic
    topic = db.relationship('Topic', backref='sessions')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'planner_id': self.planner_id,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'subject_color': self.subject.color if self.subject else '#6366f1',
            'topic_id': self.topic_id,
            'topic_name': self.topic.name if self.topic else None,
            'title': self.title,
            'scheduled_start': self.scheduled_start.isoformat() if self.scheduled_start else None,
            'scheduled_end': self.scheduled_end.isoformat() if self.scheduled_end else None,
            'duration_minutes': self.duration_minutes,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class StudyLog(db.Model):
    __tablename__ = 'study_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    session_id = db.Column(db.Integer, db.ForeignKey('study_sessions.id', ondelete='SET NULL'), nullable=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id', ondelete='SET NULL'), nullable=True)
    actual_minutes = db.Column(db.Integer, nullable=False)
    focus_rating = db.Column(db.Integer, default=5) # 1 to 5
    topics_covered = db.Column(db.Text, nullable=True)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'subject_id': self.subject_id,
            'topic_id': self.topic_id,
            'actual_minutes': self.actual_minutes,
            'focus_rating': self.focus_rating,
            'topics_covered': self.topics_covered,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
