from datetime import date
from flask import Blueprint, request, g
from app.models.revision import Revision
from app.services.revision_service import RevisionService
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

revisions_bp = Blueprint('revisions', __name__, url_prefix='/api/revisions')

@revisions_bp.route('', methods=['GET'])
@jwt_required
def list_revisions():
    status = request.args.get('status')
    due_today_only = request.args.get('due_today', 'false').lower() == 'true'

    if due_today_only:
        due = RevisionService.get_due_revisions(g.user_id)
        return success_response(data={"revisions": due})

    query = Revision.query.filter_by(user_id=g.user_id)
    if status:
        query = query.filter_by(status=status)

    revisions = query.order_by(Revision.scheduled_date.asc()).all()
    return success_response(data={"revisions": [r.to_dict() for r in revisions]})

@revisions_bp.route('/<int:id>/complete', methods=['POST'])
@jwt_required
def complete_revision(id):
    data = request.get_json() or {}
    score = float(data.get('score', 100.0))

    try:
        rev = RevisionService.complete_revision(id, g.user_id, score=score)
        return success_response(data={"revision": rev.to_dict()}, message="Revision marked as completed!")
    except ValueError as e:
        return error_response(code="NOT_FOUND", message=str(e), status_code=404)
