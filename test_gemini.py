import os
import requests

api_key = os.getenv('GEMINI_API_KEY', '')
if not api_key:
    # Try reading from backend/.env if available
    env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith('GEMINI_API_KEY='):
                    api_key = line.split('=', 1)[1].strip()
                    break

if not api_key:
    print("Please set GEMINI_API_KEY environment variable or in backend/.env")
    exit(1)
candidates = [
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest'
]

print("Testing Gemini Models with User Key:")
for m in candidates:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
    try:
        r = requests.post(url, json={'contents': [{'parts': [{'text': 'Hello Planora'}]}]}, timeout=8)
        print(f"Model: {m} -> Status: {r.status_code}")
        if r.status_code == 200:
            text = r.json()['candidates'][0]['content']['parts'][0]['text']
            print(f"  [OK] Response: {text.strip()[:60]}")
        else:
            print(f"  [ERR] {r.text[:80]}")
    except Exception as e:
        print(f"  [EXC] {e}")
