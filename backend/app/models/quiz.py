from datetime import datetime
from app.extensions import db

class Quiz(db.Model):
    __tablename__ = 'quizzes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id', ondelete='SET NULL'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    difficulty = db.Column(db.String(20), default='Medium') # Easy, Medium, Hard
    total_questions = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    questions = db.relationship('QuizQuestion', backref='quiz', cascade='all, delete-orphan')
    attempts = db.relationship('QuizAttempt', backref='quiz', cascade='all, delete-orphan')
    subject = db.relationship('Subject', backref='quizzes')
    topic = db.relationship('Topic', backref='quizzes')

    def to_dict(self, include_questions=False, include_answers=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'topic_id': self.topic_id,
            'topic_name': self.topic.name if self.topic else None,
            'title': self.title,
            'difficulty': self.difficulty,
            'total_questions': self.total_questions,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_questions:
            data['questions'] = [q.to_dict(include_answer=include_answers) for q in self.questions]
        return data

class QuizQuestion(db.Model):
    __tablename__ = 'quiz_questions'

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id', ondelete='CASCADE'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.Text, nullable=False)
    option_b = db.Column(db.Text, nullable=False)
    option_c = db.Column(db.Text, nullable=False)
    option_d = db.Column(db.Text, nullable=False)
    correct_option = db.Column(db.String(1), nullable=False) # 'A', 'B', 'C', 'D'
    explanation = db.Column(db.Text, nullable=True)
    points = db.Column(db.Integer, default=1)

    def to_dict(self, include_answer=False):
        data = {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'question_text': self.question_text,
            'options': {
                'A': self.option_a,
                'B': self.option_b,
                'C': self.option_c,
                'D': self.option_d
            },
            'points': self.points
        }
        if include_answer:
            data['correct_option'] = self.correct_option
            data['explanation'] = self.explanation
        return data

class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id', ondelete='CASCADE'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    percentage = db.Column(db.Numeric(5, 2), nullable=False)
    time_taken_seconds = db.Column(db.Integer, default=0)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Relationships
    answers = db.relationship('QuizAnswer', backref='attempt', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'quiz_id': self.quiz_id,
            'quiz_title': self.quiz.title if self.quiz else 'Quiz',
            'subject_name': self.quiz.subject.name if self.quiz and self.quiz.subject else None,
            'topic_name': self.quiz.topic.name if self.quiz and self.quiz.topic else None,
            'score': self.score,
            'total_questions': self.total_questions,
            'percentage': float(self.percentage) if self.percentage is not None else 0.0,
            'time_taken_seconds': self.time_taken_seconds,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'answers': [a.to_dict() for a in self.answers]
        }

class QuizAnswer(db.Model):
    __tablename__ = 'quiz_answers'

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey('quiz_attempts.id', ondelete='CASCADE'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('quiz_questions.id', ondelete='CASCADE'), nullable=False)
    selected_option = db.Column(db.String(1), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)

    # Relationships
    question = db.relationship('QuizQuestion')

    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.question_id,
            'question_text': self.question.question_text if self.question else '',
            'options': {
                'A': self.question.option_a,
                'B': self.question.option_b,
                'C': self.question.option_c,
                'D': self.question.option_d
            } if self.question else {},
            'selected_option': self.selected_option,
            'correct_option': self.question.correct_option if self.question else '',
            'is_correct': self.is_correct,
            'explanation': self.question.explanation if self.question else ''
        }
