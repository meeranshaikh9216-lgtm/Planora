from datetime import datetime
from app.extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(191), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    xp = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)
    role = db.Column(db.String(30), default='student', nullable=False) # student, admin
    last_active_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = db.relationship('StudentProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    subjects = db.relationship('Subject', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    planners = db.relationship('Planner', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    sessions = db.relationship('StudySession', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    study_logs = db.relationship('StudyLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    topic_progress = db.relationship('TopicProgress', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    revisions = db.relationship('Revision', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    mistakes = db.relationship('Mistake', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    quizzes = db.relationship('Quiz', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    quiz_attempts = db.relationship('QuizAttempt', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    notes = db.relationship('Note', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    flashcards = db.relationship('Flashcard', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    conversations = db.relationship('AIConversation', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    documents = db.relationship('UploadedDocument', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    user_achievements = db.relationship('UserAchievement', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    notifications = db.relationship('Notification', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    focus_sessions = db.relationship('FocusSession', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    study_memories = db.relationship('StudyMemory', backref='user', cascade='all, delete-orphan', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role or 'student',
            'xp': self.xp,
            'streak': self.streak,
            'last_active_date': self.last_active_date.isoformat() if self.last_active_date else None,
            'profile': self.profile.to_dict() if self.profile else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class StudentProfile(db.Model):
    __tablename__ = 'student_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    grade_class = db.Column(db.String(50), nullable=False)
    board = db.Column(db.String(80), nullable=False)
    stream = db.Column(db.String(80), nullable=False)
    daily_study_hours = db.Column(db.Numeric(3, 1), default=4.0)
    preferred_study_time = db.Column(db.String(50), default='evening') # morning, afternoon, evening, night
    exam_date = db.Column(db.Date, nullable=True)
    study_goal = db.Column(db.String(255), nullable=True)
    target_score = db.Column(db.String(50), nullable=True)
    onboarding_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'grade_class': self.grade_class,
            'board': self.board,
            'stream': self.stream,
            'daily_study_hours': float(self.daily_study_hours) if self.daily_study_hours is not None else 4.0,
            'preferred_study_time': self.preferred_study_time,
            'exam_date': self.exam_date.isoformat() if self.exam_date else None,
            'study_goal': self.study_goal,
            'target_score': self.target_score,
            'onboarding_completed': self.onboarding_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
