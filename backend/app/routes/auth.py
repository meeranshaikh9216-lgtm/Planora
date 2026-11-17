from flask import Blueprint, request, g
from app.extensions import db
from app.models.user import User, StudentProfile
from app.auth.security import hash_password, check_password, generate_token, jwt_required
from app.utils.responses import success_response, error_response

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return error_response(code="VALIDATION_ERROR", message="Name, email and password are required.", status_code=400)

    if len(password) < 6:
        return error_response(code="WEAK_PASSWORD", message="Password must be at least 6 characters.", status_code=400)

    existing = User.query.filter_by(email=email).first()
    if existing:
        return error_response(code="EMAIL_EXISTS", message="An account with this email already exists.", status_code=409)

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        xp=50,
        streak=1,
        role='student' # Public registration always creates a student account
    )
    db.session.add(user)
    db.session.flush()

    # Create empty student profile
    profile = StudentProfile(
        user_id=user.id,
        grade_class='Grade 12',
        board='General',
        stream='General',
        daily_study_hours=4.0,
        preferred_study_time='evening',
        onboarding_completed=False
    )
    db.session.add(profile)
    db.session.commit()

    token = generate_token(user.id, role='student')
    return success_response(
        data={
            "token": token,
            "user": user.to_dict()
        },
        message="Registration successful! Welcome to Planora.",
        status_code=201
    )

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return error_response(code="VALIDATION_ERROR", message="Email and password are required.", status_code=400)

    user = User.query.filter_by(email=email).first()
    if not user or not check_password(password, user.password_hash):
        return error_response(code="INVALID_CREDENTIALS", message="Invalid email or password.", status_code=401)

    role = getattr(user, 'role', 'student')
    token = generate_token(user.id, role=role)
    return success_response(
        data={
            "token": token,
            "user": user.to_dict()
        },
        message="Login successful."
    )

@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """
    Dedicated Administrator Login Endpoint.
    Strictly authenticates credentials and verifies that user has role == 'admin'.
    Rejects student accounts with 403 Forbidden.
    """
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return error_response(code="VALIDATION_ERROR", message="Administrator email and password are required.", status_code=400)

    user = User.query.filter_by(email=email).first()
    if not user or not check_password(password, user.password_hash):
        return error_response(code="INVALID_CREDENTIALS", message="Invalid email or password.", status_code=401)

    if getattr(user, 'role', 'student') != 'admin':
        return error_response(code="FORBIDDEN", message="Access Denied: This account does not possess administrator privileges.", status_code=403)

    token = generate_token(user.id, role='admin')
    return success_response(
        data={
            "token": token,
            "user": user.to_dict()
        },
        message="Administrator authentication verified."
    )

@auth_bp.route('/me', methods=['GET'])
@jwt_required
def get_current_user():
    return success_response(data={"user": g.current_user.to_dict()})
