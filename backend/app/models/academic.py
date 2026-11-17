from datetime import datetime
from app.extensions import db

class Subject(db.Model):
    __tablename__ = 'subjects'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), nullable=True)
    color = db.Column(db.String(30), default='#6366f1')
    icon = db.Column(db.String(50), default='book')
    target_score = db.Column(db.String(50), nullable=True)
    exam_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    topics = db.relationship('Topic', backref='subject', cascade='all, delete-orphan', order_by='Topic.order_index')
    sessions = db.relationship('StudySession', backref='subject', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'code': self.code,
            'color': self.color,
            'icon': self.icon,
            'target_score': self.target_score,
            'exam_date': self.exam_date.isoformat() if self.exam_date else None,
            'topics_count': len(self.topics),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Topic(db.Model):
    __tablename__ = 'topics'

    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    chapter = db.Column(db.String(100), nullable=True)
    difficulty = db.Column(db.String(20), default='Medium') # Easy, Medium, Hard
    estimated_minutes = db.Column(db.Integer, default=60)
    order_index = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    prerequisites = db.relationship(
        'Topic',
        secondary='topic_prerequisites',
        primaryjoin='Topic.id==TopicPrerequisite.topic_id',
        secondaryjoin='Topic.id==TopicPrerequisite.prerequisite_topic_id',
        backref='dependents'
    )
    progress_records = db.relationship('TopicProgress', backref='topic', cascade='all, delete-orphan')

    def to_dict(self, user_id=None):
        user_progress = None
        if user_id:
            prog = TopicProgress.query.filter_by(user_id=user_id, topic_id=self.id).first()
            if prog:
                user_progress = prog.to_dict()

        return {
            'id': self.id,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'subject_color': self.subject.color if self.subject else '#6366f1',
            'name': self.name,
            'description': self.description,
            'chapter': self.chapter,
            'difficulty': self.difficulty,
            'estimated_minutes': self.estimated_minutes,
            'order_index': self.order_index,
            'prerequisites': [{'id': p.id, 'name': p.name} for p in self.prerequisites],
            'progress': user_progress,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TopicPrerequisite(db.Model):
    __tablename__ = 'topic_prerequisites'

    id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id', ondelete='CASCADE'), nullable=False)
    prerequisite_topic_id = db.Column(db.Integer, db.ForeignKey('topics.id', ondelete='CASCADE'), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('topic_id', 'prerequisite_topic_id', name='uq_topic_prereq'),
    )

class TopicProgress(db.Model):
    __tablename__ = 'topic_progress'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(30), default='not_started') # not_started, learning, mastered, needs_revision
    confidence_level = db.Column(db.Integer, default=1) # 1 to 5
    quiz_attempts_count = db.Column(db.Integer, default=0)
    average_quiz_score = db.Column(db.Numeric(5, 2), default=0.0)
    last_studied_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'topic_id', name='uq_user_topic_progress'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'topic_id': self.topic_id,
            'status': self.status,
            'confidence_level': self.confidence_level,
            'quiz_attempts_count': self.quiz_attempts_count,
            'average_quiz_score': float(self.average_quiz_score) if self.average_quiz_score is not None else 0.0,
            'last_studied_at': self.last_studied_at.isoformat() if self.last_studied_at else None
        }
