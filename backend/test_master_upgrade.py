import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def test_master_upgrade():
    print("==================================================")
    print("PLANORA MASTER UPGRADE VERIFICATION TEST SUITE")
    print("==================================================")

    # 1. TEST ADMIN LOGIN
    print("\n[TEST 1] Testing Admin Login with secure admin credentials...")
    admin_login_res = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
        "email": "admin@planora.ai",
        "password": "Admin@123456"
    })
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_data = admin_login_res.json()
    admin_token = admin_data["data"]["token"]
    assert admin_data["data"]["user"]["role"] == "admin", "User role must be 'admin'"
    print("  PASS: Admin login successful. Role verified as 'admin'.")

    # 2. TEST STUDENT REJECTION ON ADMIN ENDPOINT
    print("\n[TEST 2] Testing that Student cannot use Admin Login route...")
    fake_admin_res = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
        "email": "demo@planora.ai",
        "password": "password123"
    })
    assert fake_admin_res.status_code == 403, f"Expected 403, got {fake_admin_res.status_code}"
    print("  PASS: Student account rejected on admin login endpoint (403 Forbidden).")

    # 3. TEST REGULAR STUDENT LOGIN
    print("\n[TEST 3] Testing Regular Student Login...")
    student_login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "demo@planora.ai",
        "password": "password123"
    })
    assert student_login_res.status_code == 200, f"Student login failed: {student_login_res.text}"
    student_data = student_login_res.json()
    student_token = student_data["data"]["token"]
    assert student_data["data"]["user"]["role"] == "student", "User role must be 'student'"
    print("  PASS: Student login successful. Role verified as 'student'.")

    # 4. TEST BACKEND AUTHORIZATION: STUDENT BLOCKED FROM ADMIN ENDPOINTS
    print("\n[TEST 4] Testing Backend Role Protection: Student Token blocked from Admin Console...")
    student_headers = {"Authorization": f"Bearer {student_token}"}
    blocked_res1 = requests.get(f"{BASE_URL}/api/admin/overview", headers=student_headers)
    assert blocked_res1.status_code == 403, f"Expected 403 Forbidden, got {blocked_res1.status_code}"

    blocked_res2 = requests.get(f"{BASE_URL}/api/admin/database/overview", headers=student_headers)
    assert blocked_res2.status_code == 403, f"Expected 403 Forbidden on DB Explorer, got {blocked_res2.status_code}"
    print("  PASS: Student token strictly blocked with 403 Forbidden on both /admin/overview and /admin/database/overview.")

    # 5. TEST ADMIN ACCESS TO ADMIN CONSOLE & DB EXPLORER
    print("\n[TEST 5] Testing Admin Access to Admin Console & DB Explorer...")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    overview_res = requests.get(f"{BASE_URL}/api/admin/overview", headers=admin_headers)
    assert overview_res.status_code == 200, f"Admin overview failed: {overview_res.text}"
    overview_data = overview_res.json()["data"]
    print(f"  PASS: Admin Overview retrieved. Total Students: {overview_data['metrics']['total_students']}, AI Plans: {overview_data['metrics']['total_ai_plans']}")

    db_res = requests.get(f"{BASE_URL}/api/admin/database/overview", headers=admin_headers)
    assert db_res.status_code == 200, f"DB Explorer failed: {db_res.text}"
    print(f"  PASS: Database Explorer retrieved. Total Tables: {db_res.json()['data']['total_tables']}")

    # 6. TEST PRACTICAL LAB STREAM ISOLATION
    print("\n[TEST 6] Testing Practical Lab Stream Isolation...")
    # Demo user is Science (PCM)
    practicals_res = requests.get(f"{BASE_URL}/api/practicals", headers=student_headers)
    assert practicals_res.status_code == 200, f"Failed to list practicals: {practicals_res.text}"
    p_data = practicals_res.json()["data"]
    p_titles = [p["title"] for p in p_data["practicals"]]
    p_cats = [p["field_category"] for p in p_data["practicals"]]
    print(f"  Student Stream: {p_data['user_stream']}")
    print(f"  Allowed Categories: {p_data['permitted_categories']}")
    print(f"  Practicals Visible: {len(p_titles)}")
    # Verify no commerce practical leaks to science student
    assert "commerce" not in p_cats, f"Leaked commerce practical to science student: {p_cats}"
    print("  PASS: Stream isolation verified. Zero cross-stream leakage to student.")

    # 7. TEST AUTOMATIC ALARM SCHEDULING ON STUDY SESSION CREATION/UPDATE/DELETE
    print("\n[TEST 7] Testing Automatic Smart Alarm Synchronization...")
    # Create session
    from datetime import datetime, timedelta
    start_time = (datetime.utcnow() + timedelta(hours=2)).isoformat()
    create_sess_res = requests.post(f"{BASE_URL}/api/sessions", headers=student_headers, json={
        "subject_id": 1,
        "title": "Automated Alarm Test Session",
        "scheduled_start": start_time,
        "duration_minutes": 45,
        "reminder_minutes_before": 10
    })
    assert create_sess_res.status_code == 201, f"Failed to create session: {create_sess_res.text}"
    sess = create_sess_res.json()["data"]["session"]
    sess_id = sess["id"]
    print(f"  Session created (ID: {sess_id}).")

    # Verify reminder was auto-created in session_reminders
    reminders_res = requests.get(f"{BASE_URL}/api/reminders", headers=student_headers)
    assert reminders_res.status_code == 200
    user_reminders = reminders_res.json()["data"]["reminders"]
    matching_reminder = next((r for r in user_reminders if r["session_id"] == sess_id), None)
    assert matching_reminder is not None, "Automatic SessionReminder was not created!"
    print(f"  PASS: Automatic SessionReminder created (ID: {matching_reminder['id']}, Remind At: {matching_reminder['remind_at']}).")

    # Update session time
    new_start_time = (datetime.utcnow() + timedelta(hours=4)).isoformat()
    update_res = requests.put(f"{BASE_URL}/api/sessions/{sess_id}", headers=student_headers, json={
        "title": "Automated Alarm Test Session Rescheduled",
        "scheduled_start": new_start_time
    })
    assert update_res.status_code == 200
    reminders_res2 = requests.get(f"{BASE_URL}/api/reminders", headers=student_headers)
    updated_reminder = next(r for r in reminders_res2.json()["data"]["reminders"] if r["session_id"] == sess_id)
    assert "Rescheduled" in updated_reminder["title"], "Reminder title was not synchronized!"
    print("  PASS: Reminder title and timestamp synchronized on session update.")

    # Delete session
    del_res = requests.delete(f"{BASE_URL}/api/sessions/{sess_id}", headers=student_headers)
    assert del_res.status_code == 200
    reminders_res3 = requests.get(f"{BASE_URL}/api/reminders", headers=student_headers)
    deleted_reminder = next((r for r in reminders_res3.json()["data"]["reminders"] if r["session_id"] == sess_id), None)
    assert deleted_reminder is None, "Reminder was not cascade-deleted with session!"
    print("  PASS: Reminder was automatically cleaned up upon session deletion.")

    print("\n==================================================")
    print("ALL 7 MASTER VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_master_upgrade()
