from flask import Blueprint, g
from app.services.intelligence_engine import LearningIntelligenceEngine
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

intelligence_bp = Blueprint('intelligence', __name__, url_prefix='/api/intelligence')

@intelligence_bp.route('/overview', methods=['GET'])
@jwt_required
def get_intelligence_overview():
    """
    Returns unified intelligence dashboard:
    - Learning state & cognitive retention index
    - High-risk learning gaps
    - Forgetting curve retention map
    - Explainable, grounded recommendations
    """
    try:
        state = LearningIntelligenceEngine.get_learning_state(g.user_id)
        gaps = LearningIntelligenceEngine.detect_learning_gaps(g.user_id)
        retention = LearningIntelligenceEngine.estimate_retention_curve(g.user_id)
        recommendations = LearningIntelligenceEngine.generate_explainable_recommendations(g.user_id)

        return success_response(data={
            'learning_state': state,
            'learning_gaps': gaps[:5],
            'retention_curve': retention[:8],
            'recommendations': recommendations
        })
    except Exception as e:
        return error_response(code="INTELLIGENCE_ERROR", message=f"Failed to compute learning intelligence: {str(e)}", status_code=500)


@intelligence_bp.route('/recommendations', methods=['GET'])
@jwt_required
def get_recommendations():
    """Returns explainable recommendations."""
    recs = LearningIntelligenceEngine.generate_explainable_recommendations(g.user_id)
    return success_response(data={"recommendations": recs})


@intelligence_bp.route('/retention-map', methods=['GET'])
@jwt_required
def get_retention_map():
    """Returns memory decay estimates for all student topics."""
    curve = LearningIntelligenceEngine.estimate_retention_curve(g.user_id)
    return success_response(data={"retention_map": curve})


@intelligence_bp.route('/gaps', methods=['GET'])
@jwt_required
def get_gaps():
    """Returns detected knowledge gaps."""
    gaps = LearningIntelligenceEngine.detect_learning_gaps(g.user_id)
    return success_response(data={"knowledge_gaps": gaps})
