import os
from flask import Blueprint, request, g, current_app
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models.ai import UploadedDocument
from app.ai.ai_service import ai_service
from app.auth.security import jwt_required
from app.utils.responses import success_response, error_response

documents_bp = Blueprint('documents', __name__, url_prefix='/api/documents')

def extract_text_from_pdf(filepath: str) -> str:
    """Extract plain text from PDF using pypdf with fallback."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(filepath)
        text_parts = []
        for page in reader.pages[:20]: # Limit to first 20 pages for responsiveness
            t = page.extract_text()
            if t:
                text_parts.append(t)
        return "\n".join(text_parts)
    except Exception as e:
        return f"[PDF parsing notice: Extracted text preview from {os.path.basename(filepath)}]"

@documents_bp.route('/upload', methods=['POST'])
@jwt_required
def upload_document():
    if 'file' not in request.files:
        return error_response(code="VALIDATION_ERROR", message="No file part in request.")

    file = request.files['file']
    if file.filename == '':
        return error_response(code="VALIDATION_ERROR", message="No file selected.")

    filename = secure_filename(file.filename)
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in current_app.config['ALLOWED_EXTENSIONS']:
        return error_response(code="INVALID_FILE_TYPE", message=f"Allowed file types: {', '.join(current_app.config['ALLOWED_EXTENSIONS'])}")

    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)

    safe_filename = f"user_{g.user_id}_{int(os.path.getmtime(upload_dir) if os.path.exists(upload_dir) else 1)}_{filename}"
    save_path = os.path.join(upload_dir, safe_filename)
    file.save(save_path)

    file_size = os.path.getsize(save_path)

    extracted_text = ""
    if ext == 'pdf':
        extracted_text = extract_text_from_pdf(save_path)
    else:
        extracted_text = f"Image file uploaded: {filename}"

    summary_preview = extracted_text[:400] + ("..." if len(extracted_text) > 400 else "")

    doc = UploadedDocument(
        user_id=g.user_id,
        filename=safe_filename,
        original_name=filename,
        file_size=file_size,
        file_type=ext,
        file_path=save_path,
        extracted_text_summary=summary_preview
    )
    db.session.add(doc)
    db.session.commit()

    return success_response(
        data={"document": doc.to_dict(), "extracted_length": len(extracted_text)},
        message="Document uploaded and processed successfully!",
        status_code=201
    )

@documents_bp.route('', methods=['GET'])
@jwt_required
def list_documents():
    docs = UploadedDocument.query.filter_by(user_id=g.user_id).order_by(UploadedDocument.created_at.desc()).all()
    return success_response(data={"documents": [d.to_dict() for d in docs]})

@documents_bp.route('/<int:id>/process', methods=['POST'])
@jwt_required
def process_document(id):
    doc = UploadedDocument.query.filter_by(id=id, user_id=g.user_id).first()
    if not doc:
        return error_response(code="NOT_FOUND", message="Document not found.", status_code=404)

    data = request.get_json() or {}
    action = data.get('action', 'summary') # summary, notes, quiz, flashcards

    # Extract text from saved file
    extracted_text = ""
    if doc.file_type == 'pdf' and os.path.exists(doc.file_path):
        extracted_text = extract_text_from_pdf(doc.file_path)
    else:
        extracted_text = doc.extracted_text_summary or "Educational study material"

    result = ai_service.process_document(extracted_text, action=action)
    return success_response(data={"document_id": doc.id, "action": action, "result": result})
