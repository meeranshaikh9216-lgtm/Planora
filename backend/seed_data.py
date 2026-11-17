import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from datetime import date, datetime, timedelta
from app import create_app
from app.extensions import db
from app.models.user import User, StudentProfile
from app.models.academic import Subject, Topic, TopicPrerequisite, TopicProgress
from app.models.planner import Planner, PlannerSubject, StudySession, StudyLog
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from app.models.revision import Revision, Mistake
from app.models.note import Note, Flashcard
from app.models.ai import StudyMemory
from app.auth.security import hash_password

def seed_database():
    app = create_app()
    with app.app_context():
        print("🌱 Seeding Planora Database...")

        # 1. Test User
        email = "demo@planora.ai"
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                name="Alex Mercer",
                email=email,
                password_hash=hash_password("password123"),
                xp=420,
                streak=5,
                last_active_date=date.today()
            )
            db.session.add(user)
            db.session.flush()
            print(f"✅ Created User: {email} (Password: password123)")
        else:
            print(f"ℹ️ User {email} already exists.")

        # 2. Student Profile
        profile = StudentProfile.query.filter_by(user_id=user.id).first()
        if not profile:
            profile = StudentProfile(
                user_id=user.id,
                grade_class="Grade 12",
                board="CBSE",
                stream="Science (PCM)",
                daily_study_hours=4.5,
                preferred_study_time="evening",
                exam_date=date.today() + timedelta(days=28),
                study_goal="Score 95%+ in Board Examination",
                target_score="95%",
                onboarding_completed=True
            )
            db.session.add(profile)
            db.session.flush()
            print("✅ Created Student Profile.")

        # 3. Subjects
        sub_data = [
            ("Mathematics", "MATH-12", "#6366f1", "calculator", "95%", date.today() + timedelta(days=28)),
            ("Physics", "PHY-12", "#38bdf8", "atom", "92%", date.today() + timedelta(days=35)),
            ("Chemistry", "CHEM-12", "#ec4899", "flask-conical", "90%", date.today() + timedelta(days=42))
        ]
        created_subs = {}
        for s_name, s_code, s_color, s_icon, s_target, s_exam in sub_data:
            s = Subject.query.filter_by(user_id=user.id, name=s_name).first()
            if not s:
                s = Subject(
                    user_id=user.id,
                    name=s_name,
                    code=s_code,
                    color=s_color,
                    icon=s_icon,
                    target_score=s_target,
                    exam_date=s_exam
                )
                db.session.add(s)
                db.session.flush()
            created_subs[s_name] = s

        # 4. Topics
        math_topics = [
            ("Limits & Continuity", "Calculus", "Easy", 45, 1),
            ("Differentiation", "Calculus", "Medium", 60, 2),
            ("Integration", "Calculus", "Hard", 75, 3),
            ("Differential Equations", "Calculus", "Hard", 60, 4)
        ]
        phy_topics = [
            ("Electrostatics", "Electromagnetism", "Medium", 60, 1),
            ("Current Electricity", "Electromagnetism", "Easy", 50, 2),
            ("Electromagnetic Induction", "Electromagnetism", "Hard", 70, 3)
        ]
        chem_topics = [
            ("Chemical Kinetics", "Physical Chemistry", "Medium", 55, 1),
            ("Electrochemistry", "Physical Chemistry", "Hard", 65, 2)
        ]

        created_topics = {}
        for s_name, topics_list in [("Mathematics", math_topics), ("Physics", phy_topics), ("Chemistry", chem_topics)]:
            sub = created_subs[s_name]
            for t_name, chap, diff, est, idx in topics_list:
                t = Topic.query.filter_by(subject_id=sub.id, name=t_name).first()
                if not t:
                    t = Topic(
                        subject_id=sub.id,
                        name=t_name,
                        chapter=chap,
                        difficulty=diff,
                        estimated_minutes=est,
                        order_index=idx
                    )
                    db.session.add(t)
                    db.session.flush()
                created_topics[t_name] = t

        # 5. Prerequisites (Limits -> Differentiation -> Integration -> Differential Equations)
        prereqs = [
            ("Differentiation", "Limits & Continuity"),
            ("Integration", "Differentiation"),
            ("Differential Equations", "Integration")
        ]
        for target, req in prereqs:
            t_obj = created_topics[target]
            r_obj = created_topics[req]
            if r_obj not in t_obj.prerequisites:
                t_obj.prerequisites.append(r_obj)

        # 6. Topic Progress
        progress_info = [
            ("Limits & Continuity", 'mastered', 5, 2, 95.0),
            ("Differentiation", 'learning', 4, 2, 85.0),
            ("Integration", 'needs_revision', 2, 3, 55.0),
            ("Electrostatics", 'learning', 3, 1, 75.0),
            ("Chemical Kinetics", 'not_started', 1, 0, 0.0)
        ]
        for t_name, status, conf, attempts, avg_score in progress_info:
            t = created_topics[t_name]
            prog = TopicProgress.query.filter_by(user_id=user.id, topic_id=t.id).first()
            if not prog:
                prog = TopicProgress(
                    user_id=user.id,
                    topic_id=t.id,
                    status=status,
                    confidence_level=conf,
                    quiz_attempts_count=attempts,
                    average_quiz_score=avg_score,
                    last_studied_at=datetime.utcnow() - timedelta(days=2)
                )
                db.session.add(prog)

        # 7. Mistake Bank
        integration_topic = created_topics["Integration"]
        if not Mistake.query.filter_by(user_id=user.id, topic_id=integration_topic.id).first():
            m1 = Mistake(
                user_id=user.id,
                subject_id=created_subs["Mathematics"].id,
                topic_id=integration_topic.id,
                question_text="Evaluate indefinite integral ∫ x · e^(2x) dx",
                student_answer="x · e^(2x) / 2 + C",
                correct_answer="(1/2) · x · e^(2x) - (1/4) · e^(2x) + C",
                explanation="Remember integration by parts: ∫ u v dx = u ∫ v dx - ∫ (u' ∫ v dx) dx. Applying u=x, v=e^(2x) gives (x e^(2x))/2 - ∫ (e^(2x))/2 dx.",
                recurrence_count=2,
                is_resolved=False
            )
            db.session.add(m1)

        # 8. Revisions
        today = date.today()
        if not Revision.query.filter_by(user_id=user.id, topic_id=integration_topic.id).first():
            rev1 = Revision(
                user_id=user.id,
                topic_id=integration_topic.id,
                interval_day=1,
                scheduled_date=today,
                status='pending'
            )
            rev2 = Revision(
                user_id=user.id,
                topic_id=created_topics["Differentiation"].id,
                interval_day=3,
                scheduled_date=today + timedelta(days=1),
                status='pending'
            )
            db.session.add_all([rev1, rev2])

        # 9. Notes & Flashcards
        if not Note.query.filter_by(user_id=user.id, topic_id=integration_topic.id).first():
            note = Note(
                user_id=user.id,
                subject_id=created_subs["Mathematics"].id,
                topic_id=integration_topic.id,
                title="Mastery Notes: Integration Methods",
                summary="Indefinite integration techniques including substitution, by parts, and trigonometric transformations.",
                key_points=[
                    "Integration is the inverse operation of differentiation.",
                    "Always add the arbitrary constant of integration (+ C) for indefinite integrals.",
                    "Choose u using the LIATE rule (Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential)."
                ],
                formulas=[
                    {"name": "Integration by Parts", "expression": "∫ u v dx = u ∫ v dx - ∫ [u' (∫ v dx)] dx", "usage": "Products of functions"},
                    {"name": "Standard Exponential", "expression": "∫ e^(kx) dx = (1/k) e^(kx) + C", "usage": "Exponential integration"}
                ],
                examples=[
                    {"problem": "∫ x · sin(x) dx", "approach": "Let u = x, v = sin(x)", "solution": "-x · cos(x) + sin(x) + C"}
                ],
                exam_tips=[
                    "Check your indefinite integral by differentiating the result.",
                    "Watch out for signs when integrating trigonometric cosine and sine."
                ]
            )
            db.session.add(note)

        if not Flashcard.query.filter_by(user_id=user.id, topic_id=integration_topic.id).first():
            fc1 = Flashcard(
                user_id=user.id,
                subject_id=created_subs["Mathematics"].id,
                topic_id=integration_topic.id,
                front_text="What rule determines priority for u in Integration by Parts?",
                back_text="LIATE: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential.",
                difficulty="Easy",
                mastery_level="known"
            )
            fc2 = Flashcard(
                user_id=user.id,
                subject_id=created_subs["Mathematics"].id,
                topic_id=integration_topic.id,
                front_text="What is ∫ 1/(x^2 + a^2) dx ?",
                back_text="(1/a) · arctan(x/a) + C",
                difficulty="Medium",
                mastery_level="need_revision"
            )
            db.session.add_all([fc1, fc2])

        # 10. Study Memory ("Continue Where You Stopped")
        if not StudyMemory.query.filter_by(user_id=user.id, topic_id=integration_topic.id).first():
            mem = StudyMemory(
                user_id=user.id,
                subject_id=created_subs["Mathematics"].id,
                topic_id=integration_topic.id,
                chapter="Calculus",
                last_position="Exercise 7.4 - Question 10",
                last_activity="Practiced integration by parts formulas"
            )
            db.session.add(mem)

        # 11. Study Sessions & Logs (Today & upcoming)
        if not StudySession.query.filter_by(user_id=user.id).first():
            now = datetime.utcnow()
            s_today = StudySession(
                user_id=user.id,
                subject_id=created_subs["Mathematics"].id,
                topic_id=integration_topic.id,
                title="Mathematics: Integration Practice & PYQ",
                scheduled_start=datetime(today.year, today.month, today.day, 17, 0),
                scheduled_end=datetime(today.year, today.month, today.day, 18, 30),
                duration_minutes=90,
                status='scheduled',
                notes="Focus on LIATE rule and by-parts substitution."
            )
            s_tomorrow = StudySession(
                user_id=user.id,
                subject_id=created_subs["Physics"].id,
                topic_id=created_topics["Electrostatics"].id,
                title="Physics: Electrostatics Field Calculations",
                scheduled_start=datetime(today.year, today.month, today.day, 19, 0) + timedelta(days=1),
                scheduled_end=datetime(today.year, today.month, today.day, 20, 15) + timedelta(days=1),
                duration_minutes=75,
                status='scheduled'
            )
            db.session.add_all([s_today, s_tomorrow])

            # Also seed some completed past study logs for weekly analytics chart
            for offset, mins in [(1, 60), (2, 90), (3, 45), (4, 120), (5, 75)]:
                log = StudyLog(
                    user_id=user.id,
                    subject_id=created_subs["Mathematics"].id,
                    topic_id=created_topics["Differentiation"].id,
                    actual_minutes=mins,
                    focus_rating=5,
                    topics_covered="Derivative applications & chain rule",
                    completed_at=now - timedelta(days=offset)
                )
                db.session.add(log)

        db.session.commit()
        print("🎉 Planora Database seeded successfully with real student curriculum data!")

if __name__ == '__main__':
    seed_database()
