from datetime import datetime
from app.extensions import db

class Note(db.Model):
    __tablename__ = 'notes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id', ondelete='SET NULL'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    summary = db.Column(db.Text, nullable=True)
    key_points = db.Column(db.JSON, nullable=True)
    formulas = db.Column(db.JSON, nullable=True)
    examples = db.Column(db.JSON, nullable=True)
    exam_tips = db.Column(db.JSON, nullable=True)
    raw_content = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subject = db.relationship('Subject', backref='notes')
    topic = db.relationship('Topic', backref='notes')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'topic_id': self.topic_id,
            'topic_name': self.topic.name if self.topic else None,
            'title': self.title,
            'summary': self.summary,
            'key_points': self.key_points or [],
            'formulas': self.formulas or [],
            'examples': self.examples or [],
            'exam_tips': self.exam_tips or [],
            'raw_content': self.raw_content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Flashcard(db.Model):
    __tablename__ = 'flashcards'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id', ondelete='SET NULL'), nullable=True)
    front_text = db.Column(db.Text, nullable=False)
    back_text = db.Column(db.Text, nullable=False)
    difficulty = db.Column(db.String(20), default='Medium') # Easy, Medium, Hard
    mastery_level = db.Column(db.String(20), default='new') # new, need_revision, known
    last_reviewed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subject = db.relationship('Subject', backref='flashcards')
    topic = db.relationship('Topic', backref='flashcards')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'topic_id': self.topic_id,
            'topic_name': self.topic.name if self.topic else None,
            'front_text': self.front_text,
            'back_text': self.back_text,
            'front': self.front_text,
            'back': self.back_text,
            'difficulty': self.difficulty,
            'mastery_level': self.mastery_level,
            'last_reviewed_at': self.last_reviewed_at.isoformat() if self.last_reviewed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
