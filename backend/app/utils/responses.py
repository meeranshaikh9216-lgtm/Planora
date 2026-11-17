from flask import jsonify

def success_response(data=None, message="Success", status_code=200):
    """Format standardized success JSON response."""
    response = {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }
    return jsonify(response), status_code

def error_response(code="ERROR", message="Something went wrong", status_code=400, details=None):
    """Format standardized error JSON response."""
    err_body = {
        "code": code,
        "message": message
    }
    if details:
        err_body["details"] = details

    response = {
        "success": False,
        "error": err_body
    }
    return jsonify(response), status_code
