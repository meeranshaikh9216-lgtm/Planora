import os
from dotenv import load_dotenv

# Load from .env file explicitly with absolute path
env_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
load_dotenv(dotenv_path=env_path, override=True)

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'planora-super-secret-key-study-coach-2025')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'planora-jwt-secret-key-secure-token')
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24 * 7  # 7 days
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')

    # Database — use an absolute path so it never changes regardless of working directory
    _db_dir = os.path.join(BASE_DIR, 'instance')
    os.makedirs(_db_dir, exist_ok=True)
    _default_db = 'sqlite:///' + os.path.join(_db_dir, 'planora.db').replace('\\', '/')
    DATABASE_URL = os.getenv('DATABASE_URL', _default_db)
    # If DATABASE_URL is a relative sqlite path, make it absolute
    if DATABASE_URL.startswith('sqlite:///') and not os.path.isabs(DATABASE_URL[10:]):
        DATABASE_URL = 'sqlite:///' + os.path.join(_db_dir, 'planora.db').replace('\\', '/')
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 280,
        'pool_pre_ping': True
    } if 'mysql' in DATABASE_URL else {}

    # AI Configuration
    AI_PROVIDER = os.getenv('AI_PROVIDER', 'gemini').lower()
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-3.8-flash')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

    # Uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, os.getenv('UPLOAD_FOLDER', 'uploads'))
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16 MB max
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'webp'}

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
