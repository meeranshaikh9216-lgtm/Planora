import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import json

def verify():
    # 1. Frontend check
    resp_front = urllib.request.urlopen('http://localhost:3000/')
    html = resp_front.read().decode('utf-8')
    assert 'root' in html, "Root div missing"
    print("✅ Frontend check: HTTP 200, index.html served correctly")

    # 2. Backend direct check
    resp_back = urllib.request.urlopen('http://127.0.0.1:5000/api/health')
    back_data = json.loads(resp_back.read().decode('utf-8'))
    assert back_data['success'] is True
    print(f"✅ Backend check: Status={back_data['data']['status']}, AI Provider={back_data['data']['ai_provider']}")

    # 3. Vite Proxy Login
    login_payload = json.dumps({'email': 'demo@planora.ai', 'password': 'password123'}).encode('utf-8')
    req = urllib.request.Request(
        'http://localhost:3000/api/auth/login',
        data=login_payload,
        headers={'Content-Type': 'application/json'}
    )
    resp_proxy = urllib.request.urlopen(req)
    login_res = json.loads(resp_proxy.read().decode('utf-8'))
    assert login_res['success'] is True
    user = login_res['data']['user']
    token = login_res['data']['token']
    print(f"✅ Proxy & Auth check: Logged in as {user['name']} ({user['email']}), XP={user['xp']}")
    print(f"   JWT token generated: {token[:24]}...")

    # 4. Authenticated Request through Proxy
    req_dash = urllib.request.Request(
        'http://localhost:3000/api/progress/dashboard',
        headers={'Authorization': f'Bearer {token}'}
    )
    resp_dash = urllib.request.urlopen(req_dash)
    dash_res = json.loads(resp_dash.read().decode('utf-8'))
    assert dash_res['success'] is True
    print(f"✅ Authenticated Dashboard API check: Exam Readiness={dash_res['data']['exam_readiness']}%")
    print(f"🎉 FULL SYSTEM VERIFIED AND OPERATIONAL!")

if __name__ == '__main__':
    verify()
