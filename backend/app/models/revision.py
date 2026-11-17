from datetime import datetime
from app.extensions import db

class Revision(db.Model):
    __tablename__ = 'revisions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id', ondelete='CASCADE'), nullable=False)
    interval_day = db.Column(db.Integer, nullable=False) # 1, 3, 7, 15, 30
    scheduled_date = db.Column(db.Date, nullable=False, index=True)
    status = db.Column(db.String(20), default='pending') # pending, completed, skipped
    performance_score = db.Column(db.Numeric(5, 2), nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    topic = db.relationship('Topic', backref='revisions')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'topic_id': self.topic_id,
            'topic_name': self.topic.name if self.topic else None,
            'subject_id': self.topic.subject_id if self.topic else None,
            'subject_name': self.topic.subject.name if self.topic and self.topic.subject else None,
            'subject_color': self.topic.subject.color if self.topic and self.topic.subject else '#6366f1',
            'interval_day': self.interval_day,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'status': self.status,
            'performance_score': float(self.performance_score) if self.performance_score is not None else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Mistake(db.Model):
    __tablename__ = 'mistakes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id', ondelete='SET NULL'), nullable=True)
    question_text = db.Column(db.Text, nullable=False)
    student_answer = db.Column(db.Text, nullable=True)
    correct_answer = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text, nullable=True)
    recurrence_count = db.Column(db.Integer, default=1)
    is_resolved = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subject = db.relationship('Subject', backref='mistakes')
    topic = db.relationship('Topic', backref='mistakes')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'subject_color': self.subject.color if self.subject else '#6366f1',
            'topic_id': self.topic_id,
            'topic_name': self.topic.name if self.topic else None,
            'question_text': self.question_text,
            'student_answer': self.student_answer,
            'correct_answer': self.correct_answer,
            'explanation': self.explanation,
            'recurrence_count': self.recurrence_count,
            'is_resolved': self.is_resolved,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
