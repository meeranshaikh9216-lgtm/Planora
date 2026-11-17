import React, { useState, useEffect } from 'react';
import { FileText, Upload, Sparkles, CheckCircle, ArrowRight, BookOpen, Layers, Award } from 'lucide-react';
import { api } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function PDFTeacher() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [aiAction, setAiAction] = useState('summary'); // summary, notes, quiz, flashcards
  const [processing, setProcessing] = useState(false);
  const [processedResult, setProcessedResult] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.listDocuments();
      const docs = res?.data?.documents || [];
      setDocuments(docs);
      if (docs.length > 0 && !selectedDoc) {
        setSelectedDoc(docs[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      alert("Please upload a PDF document.");
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      alert("File size exceeds 16MB limit.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await api.uploadDocument(formData);
      const newDoc = res.data.document;
      setDocuments([newDoc, ...documents]);
      setSelectedDoc(newDoc);
      alert("PDF uploaded and parsed successfully!");
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async (action) => {
    if (!selectedDoc) return;
    setAiAction(action);
    setProcessing(true);
    setProcessedResult(null);

    try {
      const res = await api.processDocument(selectedDoc.id, action);
      setProcessedResult(res.data.result);
    } catch (err) {
      alert(err.message || 'Failed to process document');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={24} color="var(--primary)" /> PDF Teacher & Document Intelligence
        </h2>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Upload syllabus materials, lecture PDFs, and notes for automated summarization, flashcards, and quizzes.
        </p>
      </div>

      <div className="two-col-responsive">
        {/* Left: Upload and Document List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Upload card */}
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <label style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.02)',
              transition: 'border-color 0.2s ease'
            }}>
              <Upload size={28} color="var(--primary)" />
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>
                {uploading ? 'Processing PDF...' : 'Upload Study PDF'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Maximum 16MB • Validated extraction
              </span>
              <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Uploaded Documents List */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
              Your Study Documents ({documents.length})
            </h4>

            {loading ? (
              <LoadingSkeleton count={2} height="50px" />
            ) : documents.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
                No PDF materials uploaded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {documents.map(doc => {
                  const isSelected = selectedDoc?.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => { setSelectedDoc(doc); setProcessedResult(null); }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <FileText size={18} color={isSelected ? 'var(--primary)' : 'var(--text-muted)'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.original_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Processing Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedDoc ? (
            <div className="card" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '8px' }}>Active Document</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 8px' }}>
                  {selectedDoc.original_name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                  <strong>Extracted Text Preview:</strong> {selectedDoc.extracted_text_summary || 'Text extracted from document.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleProcess('summary')}
                  className={`btn btn-sm ${aiAction === 'summary' && processedResult ? 'btn-primary' : 'btn-secondary'}`}
                  disabled={processing}
                >
                  <Sparkles size={14} /> Summarize PDF
                </button>
                <button
                  onClick={() => handleProcess('notes')}
                  className={`btn btn-sm ${aiAction === 'notes' && processedResult ? 'btn-primary' : 'btn-secondary'}`}
                  disabled={processing}
                >
                  <BookOpen size={14} /> Extract Notes
                </button>
                <button
                  onClick={() => handleProcess('flashcards')}
                  className={`btn btn-sm ${aiAction === 'flashcards' && processedResult ? 'btn-primary' : 'btn-secondary'}`}
                  disabled={processing}
                >
                  <Layers size={14} /> Generate Flashcards
                </button>
              </div>

              {/* Processing Spinner */}
              {processing && (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Sparkles size={30} color="var(--primary)" className="animate-float" style={{ marginBottom: '10px' }} />
                  <div style={{ fontWeight: 600, color: '#ffffff' }}>Processing document with AI model...</div>
                  <div style={{ fontSize: '0.8rem' }}>Extracting core theorems and condensing insights</div>
                </div>
              )}

              {/* Result Area */}
              {!processing && processedResult && (
                <div style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-highlight)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '1rem' }}>
                    AI Analysis Result: {processedResult.action || aiAction}
                  </div>

                  <p style={{ color: 'var(--text-main)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>
                    {processedResult.summary}
                  </p>

                  {processedResult.key_insights && processedResult.key_insights.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                        Key Insights Extracted:
                      </div>
                      <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {processedResult.key_insights.map((ins, i) => (
                          <li key={i} style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{ins}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <FileText size={44} color="var(--text-dim)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                No PDF Document Selected
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Upload or select a PDF from the left panel to begin AI processing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
