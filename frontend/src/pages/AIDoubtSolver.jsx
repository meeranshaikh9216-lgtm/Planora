import React, { useState } from 'react';
import { HelpCircle, Camera, Upload, Sparkles, CheckCircle, AlertTriangle, ArrowRight, Image as ImageIcon, X } from 'lucide-react';
import { api } from '../services/api';

export default function AIDoubtSolver() {
  const [questionText, setQuestionText] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
  };

  const handleSolve = async (e) => {
    e.preventDefault();
    if (!questionText.trim() && !imageBase64) {
      alert("Please provide question text or upload an image.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await api.solveDoubt({
        question_text: questionText,
        image_b64: imageBase64,
        subject
      });
      setResult(res.data);
    } catch (err) {
      alert(err.message || 'Failed to solve doubt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HelpCircle size={24} color="var(--accent-cyan)" /> AI Doubt Solver & Camera Teacher
        </h2>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Snap or upload textbook questions, homework problems, and hand-written formulas for immediate step-by-step resolution.
        </p>
      </div>

      <div className="two-col-responsive">
        {/* Input Form */}
        <form onSubmit={handleSolve} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label">Subject</label>
            <select className="select" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="General Science">General Science</option>
            </select>
          </div>

          <div>
            <label className="label">Question Description / Problem Text</label>
            <textarea
              className="textarea"
              rows={4}
              placeholder="e.g. Find the indefinite integral of x * e^(2x) dx, or type any formula doubt..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
            />
          </div>

          {/* Camera / Image Upload */}
          <div>
            <label className="label">Upload Question Photo / Book Page</label>
            {imagePreview ? (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-highlight)' }}>
                <img src={imagePreview} alt="Question Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
                <button
                  type="button"
                  onClick={removeImage}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.02)',
                transition: 'all 0.2s ease'
              }}>
                <Camera size={26} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Take Photo or Upload Image
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  PNG, JPG, WEBP up to 16MB
                </span>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '8px' }}
            disabled={loading}
          >
            <Sparkles size={18} />
            {loading ? 'Analyzing & Decomposing Solution...' : 'Solve Doubt Now'}
          </button>
        </form>

        {/* Solution Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading && (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <Sparkles size={36} color="var(--accent-cyan)" style={{ marginBottom: '16px' }} className="animate-float" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                AI Doubt Engine Processing
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Recognizing question formulation, checking boundary constraints, and formulating step-by-step proof...
              </p>
            </div>
          )}

          {!loading && !result && (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center', border: '1px dashed var(--border-subtle)' }}>
              <ImageIcon size={48} color="var(--text-dim)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                Ready to Solve
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto' }}>
                Type your doubt or upload a picture from your camera. Planora will return the complete solution with common traps explained.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Question Identified */}
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '6px' }}>Identified Question</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
                  {result.question_understood}
                </h3>
                {result.conceptual_category && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Category: {result.conceptual_category}
                  </span>
                )}
              </div>

              {/* Step by step */}
              {result.step_by_step_solution && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '10px' }}>
                    Step-by-Step Solution
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.step_by_step_solution.map((st, i) => (
                      <div key={i} style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.92rem',
                        lineHeight: 1.5
                      }}>
                        {st}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Answer */}
              {result.final_answer && (
                <div style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontWeight: 700,
                  fontSize: '1.05rem'
                }}>
                  {result.final_answer}
                </div>
              )}

              {/* Common Mistake Alert */}
              {result.common_mistake && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}>
                  <AlertTriangle size={20} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171', marginBottom: '2px' }}>
                      Common Mistake to Avoid
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {result.common_mistake}
                    </div>
                  </div>
                </div>
              )}

              {/* Practice Variant */}
              {result.similar_practice_question && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid var(--border-highlight)'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                    🎯 Try Similar Practice Question
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                    {result.similar_practice_question}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
