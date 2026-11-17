from flask import Blueprint, g
from app.services.progress_service import ProgressService
from app.services.gap_detector import KnowledgeGapDetector
from app.auth.security import jwt_required
from app.utils.responses import success_response

progress_bp = Blueprint('progress', __name__, url_prefix='/api/progress')

@progress_bp.route('/dashboard', methods=['GET'])
@jwt_required
def get_dashboard():
    data = ProgressService.get_dashboard_summary(g.user_id)
    return success_response(data=data)

@progress_bp.route('/analytics', methods=['GET'])
@jwt_required
def get_analytics():
    data = ProgressService.get_full_analytics(g.user_id)
    return success_response(data=data)

@progress_bp.route('/gaps', methods=['GET'])
@jwt_required
def get_knowledge_gaps():
    gaps = KnowledgeGapDetector.analyze_user_gaps(g.user_id)
    return success_response(data={"knowledge_gaps": gaps})
