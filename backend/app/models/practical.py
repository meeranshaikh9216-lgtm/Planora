from datetime import datetime
from app.extensions import db

class Practical(db.Model):
    __tablename__ = 'practicals'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)
    field_category = db.Column(db.String(50), nullable=False, index=True) # science, computer_science, engineering, commerce, humanities, vocational
    academic_level = db.Column(db.String(50), default='Undergraduate') # High School, Undergraduate, Postgraduate, Vocational
    aim = db.Column(db.Text, nullable=False)
    apparatus_or_tools = db.Column(db.Text, nullable=True) # Equipment, software, ledger books, datasets
    theory_concepts = db.Column(db.Text, nullable=True) # Underlying principles & formulas
    procedure_steps = db.Column(db.Text, nullable=True) # Step-by-step instructions (JSON or markdown)
    observations_schema = db.Column(db.Text, nullable=True) # Expected table structure or inputs
    calculations_formula = db.Column(db.Text, nullable=True) # Math/formula or algorithm logic
    safety_guidelines = db.Column(db.Text, nullable=True) # Physical safety, data hygiene, error traps
    viva_questions_json = db.Column(db.Text, nullable=True) # JSON array of {q, a} for oral exam prep
    is_custom = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subject = db.relationship('Subject', backref='practicals')
    attempts = db.relationship('PracticalAttempt', backref='practical', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'title': self.title,
            'field_category': self.field_category,
            'academic_level': self.academic_level,
            'aim': self.aim,
            'apparatus_or_tools': self.apparatus_or_tools,
            'theory_concepts': self.theory_concepts,
            'procedure_steps': self.procedure_steps,
            'observations_schema': self.observations_schema,
            'calculations_formula': self.calculations_formula,
            'safety_guidelines': self.safety_guidelines,
            'viva_questions_json': self.viva_questions_json,
            'is_custom': self.is_custom,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'attempts_count': len(self.attempts)
        }

class PracticalAttempt(db.Model):
    __tablename__ = 'practical_attempts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    practical_id = db.Column(db.Integer, db.ForeignKey('practicals.id', ondelete='CASCADE'), nullable=False, index=True)
    observations_data = db.Column(db.Text, nullable=True) # Recorded readings / inputs
    calculations_data = db.Column(db.Text, nullable=True) # Calculations output
    student_notes_or_code = db.Column(db.Text, nullable=True) # Code, observations summary, drawings
    viva_score = db.Column(db.Float, default=0.0) # Viva voce test score
    readiness_percentage = db.Column(db.Float, default=0.0) # Overall exam readiness
    feedback = db.Column(db.Text, nullable=True) # AI feedback on attempt
    status = db.Column(db.String(30), default='completed') # in_progress, completed
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='practical_attempts')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'practical_id': self.practical_id,
            'practical_title': self.practical.title if self.practical else None,
            'field_category': self.practical.field_category if self.practical else None,
            'observations_data': self.observations_data,
            'calculations_data': self.calculations_data,
            'student_notes_or_code': self.student_notes_or_code,
            'viva_score': self.viva_score,
            'readiness_percentage': self.readiness_percentage,
            'feedback': self.feedback,
            'status': self.status,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
