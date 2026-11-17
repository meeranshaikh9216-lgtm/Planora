import os
import re

base_dir = r"C:\Users\waris\Desktop\Planora"
ignore_dirs = {'node_modules', 'dist', 'dev-dist', '.git', '__pycache__', 'venv', '.venv'}
ignore_exts = {'.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2', '.ico', '.pdf', '.exe', '.db', '.sqlite', '.sqlite3'}

suspicious_patterns = [
    (re.compile(r"AQ\.[a-zA-Z0-9_\-]{20,}"), "Gemini API Key (AQ...)"),
    (re.compile(r"AIzaSy[a-zA-Z0-9_\-]{33}"), "Google AI API Key (AIzaSy...)"),
    (re.compile(r"sk-[a-zA-Z0-9]{32,}"), "OpenAI API Key"),
    (re.compile(r"(?i)(?:api[_-]?key|secret[_-]?key|jwt[_-]?secret)\s*[:=]\s*['\"][^'\"]{8,}['\"]"), "Configured Secret/Key"),
]

found = []
for root, dirs, files in os.walk(base_dir):
    dirs[:] = [d for d in dirs if d not in ignore_dirs]
    for file in files:
        ext = os.path.splitext(file)[1].lower()
        if ext in ignore_exts:
            continue
        filepath = os.path.join(root, file)
        relpath = os.path.relpath(filepath, base_dir)
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                for line_no, line in enumerate(f, 1):
                    for pattern, label in suspicious_patterns:
                        m = pattern.search(line)
                        if m:
                            found.append((relpath, line_no, label, line.strip()[:100]))
        except Exception:
            pass

print(f"Total secret matches found: {len(found)}")
for item in found:
    print(f"[{item[2]}] {item[0]}:{item[1]} -> {item[3]}")
