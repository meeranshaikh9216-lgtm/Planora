import sys, os, json
sys.path.insert(0, '.')
from app import create_app
from app.auth.security import generate_token

app = create_app()
client = app.test_client()

with app.app_context():
    token = generate_token(1) # Alex Mercer
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

    # 1. Test Database Explorer
    resp = client.get('/api/admin/database/overview', headers=headers)
    assert resp.status_code == 200, f"Explorer overview failed: {resp.status_code}"
    data = resp.get_json()['data']
    print(f"[TEST 1] DB Explorer: {data['total_tables']} tables, {data['total_rows']} total rows")

    # Table preview
    resp = client.get('/api/admin/database/table/users?per_page=5', headers=headers)
    assert resp.status_code == 200
    t_data = resp.get_json()['data']
    print(f"         Previewed {len(t_data['records'])} users records")

    # 2. Test Reminders / Alarms
    resp = client.get('/api/reminders', headers=headers)
    assert resp.status_code == 200, f"Reminders list failed: {resp.status_code}"
    rems = resp.get_json()['data']['reminders']
    print(f"[TEST 2] Reminders: {len(rems)} active alarms")

    # Test immediate alarm dispatch
    resp = client.post('/api/reminders/test', headers=headers)
    assert resp.status_code == 201
    test_rem = resp.get_json()['data']['reminder']
    print(f"         Immediate Test Alarm dispatched: ID={test_rem['id']}, title='{test_rem['title']}'")

    # 3. Test Intelligence Engine
    resp = client.get('/api/intelligence/overview', headers=headers)
    assert resp.status_code == 200, f"Intelligence overview failed: {resp.status_code}"
    intel = resp.get_json()['data']
    print(f"[TEST 3] Intelligence: Retention Index = {intel['learning_state']['overall_retention_index']}%, Recommendations = {len(intel['recommendations'])}")
    for r in intel['recommendations']:
        print(f"         Rec: '{r['title']}' -> Why: {r['why'][:60]}...")

    # 4. Test Universal Practical Lab
    resp = client.get('/api/practicals', headers=headers)
    assert resp.status_code == 200, f"Practicals list failed: {resp.status_code}"
    pracs = resp.get_json()['data']['practicals']
    print(f"[TEST 4] Practicals: {len(pracs)} practicals loaded")
    for p in pracs:
        print(f"         Practical: [{p['field_category'].upper()}] {p['title']}")

    # 5. Test Assignments
    resp = client.get('/api/assignments', headers=headers)
    assert resp.status_code == 200, f"Assignments list failed: {resp.status_code}"
    assigns = resp.get_json()['data']['assignments']
    print(f"[TEST 5] Assignments: {len(assigns)} assignments loaded")

    print("\n[ALL TESTS PASSED] All 5 new backend service endpoints are working and verified!")
