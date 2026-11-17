from datetime import datetime, date
from flask import Blueprint, request, g
from app.extensions import db
from app.models.assignment import Assignment
from app.models.academic import Subject
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

assignments_bp = Blueprint('assignments', __name__, url_prefix='/api/assignments')

@assignments_bp.route('', methods=['GET'])
@jwt_required
def list_assignments():
    """Returns list of student's assignments, submissions, and project milestones."""
    status = request.args.get('status')
    priority = request.args.get('priority')
    subject_id = request.args.get('subject_id')

    query = Assignment.query.filter_by(user_id=g.user_id)
    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)

    assignments = query.order_by(Assignment.due_date.asc()).all()
    return success_response(data={"assignments": [a.to_dict() for a in assignments]})


@assignments_bp.route('', methods=['POST'])
@jwt_required
def create_assignment():
    """Creates a new assignment or submission milestone."""
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    due_date_str = data.get('due_date')

    if not title or not due_date_str:
        return error_response(code="VALIDATION_ERROR", message="Title and Due Date are required.")

    try:
        due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
    except Exception:
        due_date = date.today()

    assign = Assignment(
        user_id=g.user_id,
        subject_id=data.get('subject_id'),
        title=title,
        description=data.get('description'),
        due_date=due_date,
        priority=data.get('priority', 'Medium'),
        status='pending',
        progress_percentage=int(data.get('progress_percentage', 0))
    )
    db.session.add(assign)
    db.session.commit()

    return success_response(data={"assignment": assign.to_dict()}, message="Assignment created successfully.", status_code=201)


@assignments_bp.route('/<int:id>', methods=['PUT'])
@jwt_required
def update_assignment(id):
    """Updates status or progress of an assignment."""
    assign = Assignment.query.filter_by(id=id, user_id=g.user_id).first()
    if not assign:
        return error_response(code="NOT_FOUND", message="Assignment not found.", status_code=404)

    data = request.get_json() or {}
    if 'title' in data: assign.title = data['title'].strip()
    if 'description' in data: assign.description = data['description']
    if 'status' in data:
        assign.status = data['status']
        if data['status'] == 'completed':
            assign.progress_percentage = 100
    if 'progress_percentage' in data:
        assign.progress_percentage = int(data['progress_percentage'])
        if assign.progress_percentage >= 100:
            assign.status = 'completed'
    if 'priority' in data: assign.priority = data['priority']
    if 'due_date' in data and data['due_date']:
        try:
            assign.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        except Exception:
            pass

    db.session.commit()
    return success_response(data={"assignment": assign.to_dict()}, message="Assignment updated successfully.")


@assignments_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required
def delete_assignment(id):
    """Deletes an assignment."""
    assign = Assignment.query.filter_by(id=id, user_id=g.user_id).first()
    if not assign:
        return error_response(code="NOT_FOUND", message="Assignment not found.", status_code=404)

    db.session.delete(assign)
    db.session.commit()
    return success_response(message="Assignment deleted.")
