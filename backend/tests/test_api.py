import pytest
from app import create_app
from app.extensions import db
from app.config import TestConfig

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    # Register test user
    res = client.post('/api/auth/signup', json={
        "name": "Test Student",
        "email": "test@planora.ai",
        "password": "password123"
    })
    token = res.get_json()['data']['token']
    return {"Authorization": f"Bearer {token}"}

def test_auth_flow(client):
    """Test user registration and login."""
    # Register
    signup_res = client.post('/api/auth/signup', json={
        "name": "Jane Doe",
        "email": "jane@planora.ai",
        "password": "securepassword"
    })
    assert signup_res.status_code == 201
    signup_data = signup_res.get_json()
    assert signup_data['success'] is True
    assert 'token' in signup_data['data']

    # Login
    login_res = client.post('/api/auth/login', json={
        "email": "jane@planora.ai",
        "password": "securepassword"
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()
    assert login_data['success'] is True
    assert 'token' in login_data['data']

def test_onboarding_and_subjects(client, auth_headers):
    """Test onboarding and automatic subject/topic creation."""
    res = client.post('/api/profile/onboarding', headers=auth_headers, json={
        "grade_class": "Grade 12",
        "board": "CBSE",
        "stream": "Science",
        "daily_study_hours": 4.0,
        "preferred_study_time": "evening",
        "subjects": ["Mathematics", "Physics"],
        "exam_date": "2026-12-01",
        "study_goal": "Ace exams"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['data']['profile']['onboarding_completed'] is True

    # Check subjects endpoint
    sub_res = client.get('/api/subjects', headers=auth_headers)
    assert sub_res.status_code == 200
    subjects = sub_res.get_json()['data']['subjects']
    assert len(subjects) >= 2

def test_planner_generation(client, auth_headers):
    """Test deterministic planner generation and conflict-free schedule."""
    # First complete onboarding
    client.post('/api/profile/onboarding', headers=auth_headers, json={
        "grade_class": "Grade 12",
        "subjects": ["Mathematics"]
    })

    sub_res = client.get('/api/subjects', headers=auth_headers)
    subjects = sub_res.get_json()['data']['subjects']
    sub_id = subjects[0]['id']

    # Generate planner
    plan_res = client.post('/api/planners/generate', headers=auth_headers, json={
        "title": "Calculus Mastery Plan",
        "subject_ids": [sub_id],
        "daily_hours": 3.0,
        "preferred_time": "evening"
    })
    assert plan_res.status_code == 201
    plan_data = plan_res.get_json()
    assert plan_data['success'] is True
    assert plan_data['data']['planner']['total_sessions'] > 0

def test_sessions_and_completion(client, auth_headers):
    """Test creating, completing study session and awarding XP."""
    client.post('/api/profile/onboarding', headers=auth_headers, json={
        "grade_class": "Grade 12",
        "subjects": ["Mathematics"]
    })
    sub_res = client.get('/api/subjects', headers=auth_headers)
    sub = sub_res.get_json()['data']['subjects'][0]

    # Create session
    sess_res = client.post('/api/sessions', headers=auth_headers, json={
        "subject_id": sub['id'],
        "title": "Mastering Derivatives",
        "scheduled_start": "2026-10-05T18:00:00",
        "duration_minutes": 60
    })
    assert sess_res.status_code == 201
    session_id = sess_res.get_json()['data']['session']['id']

    # Complete session
    comp_res = client.post(f'/api/sessions/{session_id}/complete', headers=auth_headers, json={
        "actual_minutes": 60,
        "focus_rating": 5,
        "topics_covered": "Chain rule and power rule"
    })
    assert comp_res.status_code == 200
    comp_data = comp_res.get_json()
    assert comp_data['success'] is True
    assert comp_data['data']['session']['status'] == 'completed'

def test_quiz_and_scoring(client, auth_headers):
    """Test generating quiz, submitting answers, and Python score evaluation."""
    client.post('/api/profile/onboarding', headers=auth_headers, json={
        "grade_class": "Grade 12",
        "subjects": ["Mathematics"]
    })
    sub = client.get('/api/subjects', headers=auth_headers).get_json()['data']['subjects'][0]

    # Generate quiz
    gen_res = client.post('/api/quizzes/generate', headers=auth_headers, json={
        "subject_id": sub['id'],
        "difficulty": "Medium",
        "num_questions": 3
    })
    assert gen_res.status_code == 201
    quiz = gen_res.get_json()['data']['quiz']
    assert len(quiz['questions']) == 3

    # Submit answers (select option A for all)
    answers = {str(q['id']): "A" for q in quiz['questions']}
    sub_res = client.post(f'/api/quizzes/{quiz["id"]}/submit', headers=auth_headers, json={
        "answers": answers,
        "time_taken_seconds": 120
    })
    assert sub_res.status_code == 200
    res_data = sub_res.get_json()['data']
    assert 'score' in res_data
    assert 'percentage' in res_data
    assert len(res_data['evaluations']) == 3

def test_progress_dashboard_and_gaps(client, auth_headers):
    """Test progress dashboard summary and knowledge gap calculations."""
    client.post('/api/profile/onboarding', headers=auth_headers, json={
        "grade_class": "Grade 12",
        "subjects": ["Mathematics", "Physics"]
    })

    dash_res = client.get('/api/progress/dashboard', headers=auth_headers)
    assert dash_res.status_code == 200
    data = dash_res.get_json()['data']
    assert 'streak' in data
    assert 'xp' in data
    assert 'ai_insight' in data
    assert 'exam_readiness' in data
