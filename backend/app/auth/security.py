import time
import bcrypt
import jwt
from functools import wraps
from flask import request, current_app, g
from app.utils.responses import error_response

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def generate_token(user_id: int, role: str = None) -> str:
    """Generate JWT access token for user."""
    if role is None:
        try:
            from app.models.user import User
            from app.extensions import db
            u = db.session.get(User, user_id)
            role = getattr(u, 'role', 'student') if u else 'student'
        except Exception:
            role = 'student'

    payload = {
        'sub': str(user_id),
        'role': role,
        'iat': int(time.time()),
        'exp': int(time.time()) + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def decode_token(token: str):
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def jwt_required(f):
    """Decorator to protect API endpoints using JWT authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return error_response(code="UNAUTHORIZED", message="Authorization header missing", status_code=401)
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return error_response(code="INVALID_TOKEN", message="Token format must be: Bearer <token>", status_code=401)
        
        token = parts[1]
        payload = decode_token(token)
        if not payload:
            return error_response(code="EXPIRED_OR_INVALID_TOKEN", message="Token is invalid or expired. Please log in again.", status_code=401)
        
        # Store current user ID in Flask global `g`
        sub = payload.get('sub')
        try:
            g.user_id = int(sub)
        except (ValueError, TypeError):
            return error_response(code="INVALID_TOKEN", message="Invalid token subject", status_code=401)
        
        # Load user model and role
        from app.models.user import User
        from app.extensions import db
        user = db.session.get(User, g.user_id)
        if not user:
            return error_response(code="USER_NOT_FOUND", message="Authenticated user no longer exists", status_code=401)
        
        g.current_user = user
        g.user_role = getattr(user, 'role', 'student')

        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require that the authenticated user has role == 'admin'."""
    @wraps(f)
    @jwt_required
    def decorated_function(*args, **kwargs):
        role = getattr(g, 'user_role', 'student')
        if role != 'admin':
            return error_response(code="FORBIDDEN", message="Administrator privileges required to access this resource.", status_code=403)
        return f(*args, **kwargs)
    return decorated_function
