import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() in ['true', '1', 't']
    print(f"==================================================")
    print(f"🚀 PLANORA BACKEND - AI STUDY COACH")
    print(f"   Listening on: http://127.0.0.1:{port}")
    print(f"   API Base URL: http://127.0.0.1:{port}/api")
    print(f"==================================================")
    app.run(host='0.0.0.0', port=port, debug=debug, use_reloader=False)
