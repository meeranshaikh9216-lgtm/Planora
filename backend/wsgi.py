"""
Production WSGI entry point for Planora.
Compatible with Gunicorn (Linux/Docker/Cloud Run):
    gunicorn --workers 4 --bind 0.0.0.0:5000 wsgi:app
Or Waitress (Windows):
    waitress-serve --port=5000 wsgi:app
"""
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
    app.run(host='0.0.0.0', port=port)
