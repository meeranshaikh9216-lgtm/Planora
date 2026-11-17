from datetime import datetime, date, timedelta
from flask import Blueprint, request, g
from app.extensions import db
from app.models.planner import Planner, StudySession
from app.services.planner_service import PlannerService
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

planners_bp = Blueprint('planners', __name__, url_prefix='/api/planners')

@planners_bp.route('', methods=['GET'])
@jwt_required
def list_planners():
    planners = Planner.query.filter_by(user_id=g.user_id).order_by(Planner.created_at.desc()).all()
    return success_response(data={"planners": [p.to_dict() for p in planners]})

@planners_bp.route('/generate', methods=['POST'])
@jwt_required
def generate_planner():
    data = request.get_json() or {}
    title = data.get('title', 'Target Examination Study Sprint').strip()
    subject_ids = data.get('subject_ids', [])
    daily_hours = float(data.get('daily_hours', 4.0))
    preferred_time = data.get('preferred_time', 'evening')

    start_date = date.today()
    if data.get('start_date'):
        try:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    end_date = start_date + timedelta(days=14) # default 2 weeks
    if data.get('end_date'):
        try:
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    try:
        planner = PlannerService.generate_schedule(
            user_id=g.user_id,
            title=title,
            subject_ids=subject_ids,
            start_date=start_date,
            end_date=end_date,
            daily_hours=daily_hours,
            preferred_time=preferred_time
        )
        return success_response(
            data={"planner": planner.to_dict()},
            message=f"Smart study schedule generated with {len(planner.sessions)} sessions!",
            status_code=201
        )
    except Exception as e:
        return error_response(code="PLANNER_ERROR", message=f"Failed to generate study plan: {str(e)}", status_code=500)

@planners_bp.route('/<int:id>', methods=['GET'])
@jwt_required
def get_planner(id):
    planner = Planner.query.filter_by(id=id, user_id=g.user_id).first()
    if not planner:
        return error_response(code="NOT_FOUND", message="Planner not found.", status_code=404)

    sessions = [s.to_dict() for s in planner.sessions]
    data = planner.to_dict()
    data['sessions'] = sessions
    return success_response(data={"planner": data})

@planners_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required
def delete_planner(id):
    planner = Planner.query.filter_by(id=id, user_id=g.user_id).first()
    if not planner:
        return error_response(code="NOT_FOUND", message="Planner not found.", status_code=404)

    db.session.delete(planner)
    db.session.commit()
    return success_response(message="Planner and its sessions deleted.")
