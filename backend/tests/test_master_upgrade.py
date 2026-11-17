import unittest
import json
import os
import sys
from datetime import datetime, timedelta, date

# Add backend root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.auth.security import generate_token
from app.models import (
    User, Subject, Topic, StudySession, SessionReminder,
    Practical, PracticalAttempt, Assignment, Quiz, QuizAttempt, Mistake
)
from app.services.intelligence_engine import LearningIntelligenceEngine

class MasterUpgradeTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        cls.ctx = cls.app.app_context()
        cls.ctx.push()

        # Generate tokens for user 1 (Alex Mercer), user 2 (Meeran), and user 7 (Admin)
        cls.token_user1 = generate_token(1)
        cls.token_user2 = generate_token(2)
        cls.token_admin = generate_token(7)
        cls.headers_user1 = {'Authorization': f'Bearer {cls.token_user1}', 'Content-Type': 'application/json'}
        cls.headers_user2 = {'Authorization': f'Bearer {cls.token_user2}', 'Content-Type': 'application/json'}
        cls.headers_admin = {'Authorization': f'Bearer {cls.token_admin}', 'Content-Type': 'application/json'}

    @classmethod
    def tearDownClass(cls):
        cls.ctx.pop()

    def test_1_database_tables_count_and_integrity(self):
        """Verify that all 30 registered tables exist and integrity passes."""
        inspector = db.inspect(db.engine)
        tables = set(inspector.get_table_names())
        expected_tables = {
            'users', 'student_profiles', 'subjects', 'topics', 'topic_prerequisites',
            'topic_progress', 'planners', 'planner_subjects', 'study_sessions',
            'study_logs', 'focus_sessions', 'flashcards', 'revisions', 'mistakes',
            'quizzes', 'quiz_questions', 'quiz_attempts', 'quiz_answers',
            'practicals', 'practical_attempts', 'assignments', 'session_reminders',
            'notes', 'ai_conversations', 'ai_messages', 'study_memories',
            'uploaded_documents', 'achievements', 'user_achievements', 'notifications'
        }
        self.assertTrue(expected_tables.issubset(tables), f"Missing tables: {expected_tables - tables}")
        
        # Verify SQLite integrity
        if 'sqlite' in str(db.engine.url):
            result = db.session.execute(db.text("PRAGMA integrity_check")).scalar()
            self.assertEqual(result, 'ok')

    def test_2_database_explorer_api(self):
        """Test in-app Database Explorer schema and paginated record APIs with RBAC verification."""
        # Student user must be forbidden from accessing admin database explorer
        forbidden_resp = self.client.get('/api/admin/database/overview', headers=self.headers_user1)
        self.assertEqual(forbidden_resp.status_code, 403)

        # Admin user must be permitted
        resp = self.client.get('/api/admin/database/overview', headers=self.headers_admin)
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()['data']
        self.assertGreaterEqual(data['total_tables'], 30)
        self.assertGreater(data['total_rows'], 0)

        # Test querying records with search and pagination as admin
        resp = self.client.get('/api/admin/database/table/users?page=1&per_page=5', headers=self.headers_admin)
        self.assertEqual(resp.status_code, 200)
        table_data = resp.get_json()['data']
        self.assertEqual(table_data['table_name'], 'users')
        self.assertIn('records', table_data)
        self.assertIn('pagination', table_data)

    def test_3_smart_alarms_and_reminders(self):
        """Test scheduling, testing, snoozing, and dismissing study alarms."""
        # Create an alarm
        resp = self.client.post('/api/reminders', headers=self.headers_user1, json={
            'title': 'Unit Test Automated Alarm',
            'subject_name': 'Mathematics',
            'topic_name': 'Calculus',
            'minutes_before': 15,
            'sound_enabled': True
        })
        self.assertEqual(resp.status_code, 201)
        alarm_id = resp.get_json()['data']['reminder']['id']

        # Query due reminders
        resp = self.client.get('/api/reminders/due', headers=self.headers_user1)
        self.assertEqual(resp.status_code, 200)

        # Snooze alarm
        resp = self.client.post(f'/api/reminders/{alarm_id}/snooze', headers=self.headers_user1, json={'minutes': 5})
        self.assertEqual(resp.status_code, 200)

        # Dismiss alarm
        resp = self.client.post(f'/api/reminders/{alarm_id}/dismiss', headers=self.headers_user1)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()['data']['reminder']['status'], 'dismissed')

        # Test alarm endpoint
        resp = self.client.post('/api/reminders/test', headers=self.headers_user1)
        self.assertEqual(resp.status_code, 201)

    def test_4_learning_intelligence_engine(self):
        """Test retention decay calculation and explainable recommendations."""
        resp = self.client.get('/api/intelligence/overview', headers=self.headers_user1)
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()['data']

        # Learning state
        state = data['learning_state']
        self.assertIn('overall_retention_index', state)
        self.assertIn('topics_total', state)

        # Explainable recommendations
        recs = data['recommendations']
        self.assertIsInstance(recs, list)
        self.assertGreater(len(recs), 0)
        for r in recs:
            self.assertIn('what', r)
            self.assertIn('why', r)
            self.assertIn('evidence', r)
            self.assertIn('action_link', r)

    def test_5_universal_practical_lab(self):
        """Test practical listing, custom creation, attempt submission and viva evaluation."""
        # List practicals
        resp = self.client.get('/api/practicals', headers=self.headers_user1)
        self.assertEqual(resp.status_code, 200)
        pracs = resp.get_json()['data']['practicals']
        self.assertGreater(len(pracs), 0)
        target_id = pracs[0]['id']

        # Get specific practical
        resp = self.client.get(f'/api/practicals/{target_id}', headers=self.headers_user1)
        self.assertEqual(resp.status_code, 200)
        detail = resp.get_json()['data']['practical']
        self.assertIn('procedure_steps_parsed', detail)
        self.assertIn('observations_schema_parsed', detail)

        # Submit practical attempt
        resp = self.client.post(f'/api/practicals/{target_id}/submit-attempt', headers=self.headers_user1, json={
            'observations_data': 'Trial 1: I=0.2A, V=1.0V; Trial 2: I=0.4A, V=2.0V',
            'calculations_data': 'Slope = 5.0 ohms',
            'viva_score': 90.0
        })
        self.assertEqual(resp.status_code, 201)
        attempt = resp.get_json()['data']['attempt']
        self.assertGreater(attempt['readiness_percentage'], 0)

        # Evaluate viva question
        resp = self.client.post('/api/practicals/viva-evaluate', headers=self.headers_user1, json={
            'question': 'What does the slope of a V-I graph represent?',
            'ideal_answer': 'Resistance of the conductor',
            'student_answer': 'It represents the electrical resistance R.'
        })
        self.assertEqual(resp.status_code, 200)
        self.assertIn('score_out_of_100', resp.get_json()['data'])

    def test_6_assignments_and_deadlines(self):
        """Test creating, updating progress, and completing an academic assignment."""
        due_str = (date.today() + timedelta(days=7)).isoformat()
        resp = self.client.post('/api/assignments', headers=self.headers_user1, json={
            'title': 'Chemistry Lab Portfolio Submission',
            'due_date': due_str,
            'priority': 'High',
            'description': 'Final portfolio write-up for 6 experiments'
        })
        self.assertEqual(resp.status_code, 201)
        assign_id = resp.get_json()['data']['assignment']['id']

        # Update progress
        resp = self.client.put(f'/api/assignments/{assign_id}', headers=self.headers_user1, json={
            'progress_percentage': 100,
            'status': 'completed'
        })
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()['data']['assignment']['status'], 'completed')

        # Clean up
        resp = self.client.delete(f'/api/assignments/{assign_id}', headers=self.headers_user1)
        self.assertEqual(resp.status_code, 200)

    def test_7_user_data_isolation(self):
        """Verify student 2 cannot access student 1's private assignments."""
        # Create an assignment as user 1
        resp = self.client.post('/api/assignments', headers=self.headers_user1, json={
            'title': 'User 1 Confidential Assignment',
            'due_date': (date.today() + timedelta(days=2)).isoformat()
        })
        self.assertEqual(resp.status_code, 201)
        assign_id = resp.get_json()['data']['assignment']['id']

        # Try to delete user 1's assignment using user 2's token
        resp = self.client.delete(f'/api/assignments/{assign_id}', headers=self.headers_user2)
        self.assertEqual(resp.status_code, 404, "User 2 should not be able to find/delete User 1's records")

        # Clean up as user 1
        self.client.delete(f'/api/assignments/{assign_id}', headers=self.headers_user1)

if __name__ == '__main__':
    unittest.main()
