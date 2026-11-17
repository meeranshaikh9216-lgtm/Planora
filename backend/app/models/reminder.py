from datetime import datetime
from app.extensions import db

class SessionReminder(db.Model):
    __tablename__ = 'session_reminders'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    session_id = db.Column(db.Integer, db.ForeignKey('study_sessions.id', ondelete='CASCADE'), nullable=True, index=True)
    title = db.Column(db.String(150), nullable=False)
    subject_name = db.Column(db.String(100), nullable=True)
    topic_name = db.Column(db.String(150), nullable=True)
    scheduled_start = db.Column(db.DateTime, nullable=False)
    remind_at = db.Column(db.DateTime, nullable=False, index=True)
    minutes_before = db.Column(db.Integer, default=10)
    sound_enabled = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(30), default='pending', index=True) # pending, delivered, dismissed, snoozed
    delivered_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('reminders', cascade='all, delete-orphan'))
    session = db.relationship('StudySession', backref=db.backref('reminders', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'title': self.title,
            'subject_name': self.subject_name,
            'topic_name': self.topic_name,
            'scheduled_start': self.scheduled_start.isoformat() if self.scheduled_start else None,
            'remind_at': self.remind_at.isoformat() if self.remind_at else None,
            'minutes_before': self.minutes_before,
            'sound_enabled': self.sound_enabled,
            'status': self.status,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
