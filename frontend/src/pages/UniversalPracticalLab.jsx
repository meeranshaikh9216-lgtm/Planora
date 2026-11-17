import React, { useState, useEffect } from 'react';
import { FlaskConical, Code, Briefcase, BookOpen, Wrench, Sparkles, CheckCircle, Award, ChevronRight, Play, ShieldAlert, FileText, Send, RefreshCw, Plus } from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  { id: 'all', label: 'All Disciplines', icon: FlaskConical },
  { id: 'science', label: 'Sciences (Physics/Chem/Bio)', icon: FlaskConical },
  { id: 'computer_science', label: 'Computer Science & IT', icon: Code },
  { id: 'engineering', label: 'Engineering & Tech', icon: Wrench },
  { id: 'commerce', label: 'Commerce & Accounting', icon: Briefcase },
  { id: 'humanities', label: 'Arts & Humanities', icon: BookOpen },
  { id: 'vocational', label: 'Vocational & Applied', icon: Wrench }
];

export default function UniversalPracticalLab() {
  const [practicals, setPracticals] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Active Selected Practical Modal
  const [selectedPractical, setSelectedPractical] = useState(null);
  const [activeTab, setActiveTab] = useState('guide'); // guide, observations, viva

  // Observation & Viva state
  const [studentObservations, setStudentObservations] = useState('');
  const [studentCalculations, setStudentCalculations] = useState('');
  const [vivaAnswers, setVivaAnswers] = useState({});
  const [vivaFeedback, setVivaFeedback] = useState({});
  const [evaluatingViva, setEvaluatingViva] = useState(false);
  const [submittingAttempt, setSubmittingAttempt] = useState(false);
  const [attemptSuccess, setAttemptSuccess] = useState('');

  // AI Generator Modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genCategory, setGenCategory] = useState('science');
  const [genLevel, setGenLevel] = useState('Undergraduate');
  const [generating, setGenerating] = useState(false);

  // Stream isolation metadata
  const [userStream, setUserStream] = useState('');
  const [permittedCategories, setPermittedCategories] = useState([]);
  const [allowCrossStream, setAllowCrossStream] = useState(false);

  useEffect(() => {
    loadPracticals();
  }, [activeCategory, allowCrossStream]);

  const loadPracticals = async () => {
    setLoading(true);
    try {
      const query = `category=${activeCategory}&search=${encodeURIComponent(searchQuery)}&allow_all=${allowCrossStream}`;
      const res = await api.listPracticals(query);
      setPracticals(res.data?.practicals || []);
      if (res.data?.user_stream) setUserStream(res.data.user_stream);
      if (res.data?.permitted_categories) setPermittedCategories(res.data.permitted_categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPractical = async (id) => {
    try {
      const res = await api.getPractical(id);
      setSelectedPractical(res.data?.practical);
      setActiveTab('guide');
      setStudentObservations('');
      setStudentCalculations('');
      setVivaAnswers({});
      setVivaFeedback({});
      setAttemptSuccess('');
    } catch (err) {
      alert('Failed to load practical details');
    }
  };

  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (!genTopic.trim()) return;
    setGenerating(true);
    try {
      const res = await api.aiGeneratePractical({
        topic: genTopic,
        field_category: genCategory,
        academic_level: genLevel
      });
      setShowGenModal(false);
      setGenTopic('');
      loadPracticals();
      if (res.data?.practical?.id) {
        handleOpenPractical(res.data.practical.id);
      }
    } catch (err) {
      alert(err.message || 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleEvaluateViva = async (qIndex, question, idealAnswer) => {
    const studentAns = vivaAnswers[qIndex];
    if (!studentAns || !studentAns.trim()) return;
    setEvaluatingViva(true);
    try {
      const res = await api.evaluateVivaAnswer({
        question,
        ideal_answer: idealAnswer,
        student_answer: studentAns
      });
      setVivaFeedback(prev => ({
        ...prev,
        [qIndex]: res.data
      }));
    } catch (err) {
      alert('Failed to evaluate answer');
    } finally {
      setEvaluatingViva(false);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!selectedPractical) return;
    setSubmittingAttempt(true);
    try {
      // Average viva score if answered
      const feedbackValues = Object.values(vivaFeedback);
      const avgViva = feedbackValues.length > 0
        ? Math.round(feedbackValues.reduce((acc, curr) => acc + (curr.score_out_of_100 || 80), 0) / feedbackValues.length)
        : 85.0;

      const res = await api.submitPracticalAttempt(selectedPractical.id, {
        observations_data: studentObservations || 'Completed observation checklist',
        calculations_data: studentCalculations || 'Calculations verified',
        viva_score: avgViva
      });
      setAttemptSuccess(`Practical attempt logged! Exam Readiness Score: ${res.data?.attempt?.readiness_percentage}%`);
    } catch (err) {
      alert(err.message || 'Failed to submit attempt');
    } finally {
      setSubmittingAttempt(false);
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FlaskConical size={13} /> Universal Practical Lab
            </span>
            <span className="badge badge-cyan">Cross-Disciplinary Laboratory</span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Practical Preparation & Viva Voce Lab
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Comprehensive laboratory manuals, observation table recorders, and AI viva voce oral examiners for Science, CS, Commerce, and Arts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowGenModal(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
          >
            <Sparkles size={15} /> AI Practical Generator
          </button>
        </div>
      </div>

      {/* Academic Stream Isolation Banner */}
      {userStream && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '10px',
          padding: '10px 16px',
          fontSize: '0.85rem',
          color: '#a5b4fc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} color="#34d399" />
            <span>
              Curriculum Stream: <strong style={{ color: '#ffffff' }}>{userStream}</strong> — Experiments automatically filtered for your academic syllabus.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAllowCrossStream(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: allowCrossStream ? '#34d399' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {allowCrossStream ? 'Strict Stream Filter: ON' : 'Explore All Academic Disciplines'}
          </button>
        </div>
      )}

      {/* Discipline Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {CATEGORIES.filter(cat => {
          if (allowCrossStream || permittedCategories.length === 0 || cat.id === 'all') return true;
          return permittedCategories.includes(cat.id);
        }).map(cat => {
          const Icon = cat.icon;
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: active ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                background: active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                color: active ? '#ffffff' : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} color={active ? 'var(--primary)' : '#94a3b8'} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Practicals Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading practical manuals...</div>
      ) : practicals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <FlaskConical size={36} color="var(--primary)" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            No Practicals in this Discipline Yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 20px' }}>
            Click "AI Practical Generator" to instantly synthesize an experiment manual, observation schema, and viva oral questions for any topic!
          </p>
          <button onClick={() => setShowGenModal(true)} className="btn btn-primary btn-sm">
            Generate First Practical with AI
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {practicals.map(p => (
            <div
              key={p.id}
              className="card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'transform 0.2s, border-color 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => handleOpenPractical(p.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-cyan" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {p.field_category.replace('_', ' ')}
                </span>
                <span className="badge badge-primary">{p.academic_level}</span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px', lineHeight: 1.4 }}>
                  {p.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  <strong>Aim:</strong> {p.aim}
                </p>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', fontSize: '0.8rem', color: '#cbd5e1' }}>
                <div><strong>Tools/Apparatus:</strong> {p.apparatus_or_tools || 'Standard apparatus'}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {p.attempts_count > 0 ? `✓ Attempted (${p.attempts_count})` : 'Not yet attempted'}
                </span>
                <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Launch Practical <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Practical Workspace Modal */}
      {selectedPractical && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '24px'
        }}>
          <div className="card" style={{ maxWidth: '960px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge badge-cyan">{selectedPractical.field_category.toUpperCase()}</span>
                  <span className="badge badge-primary">{selectedPractical.academic_level}</span>
                </div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {selectedPractical.title}
                </h2>
              </div>
              <button onClick={() => setSelectedPractical(null)} className="btn btn-secondary btn-sm">Close</button>
            </div>

            {/* Sub-Tabs: Lab Guide | Observations | Viva Voce */}
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              {[
                { id: 'guide', label: '1. Manual & Procedure', icon: FileText },
                { id: 'observations', label: '2. Observation & Calculations', icon: FlaskConical },
                { id: 'viva', label: '3. Viva Voce Oral Exam', icon: Award }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: activeTab === t.id ? 'var(--primary)' : 'transparent',
                    color: activeTab === t.id ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: GUIDE */}
            {activeTab === 'guide' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '4px' }}>Experimental Aim</div>
                  <div style={{ color: '#ffffff', fontSize: '0.94rem', lineHeight: 1.5 }}>{selectedPractical.aim}</div>
                </div>

                {selectedPractical.apparatus_or_tools && (
                  <div>
                    <h4 style={{ fontSize: '0.92rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Apparatus & Tools Required</h4>
                    <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.5 }}>{selectedPractical.apparatus_or_tools}</p>
                  </div>
                )}

                {selectedPractical.theory_concepts && (
                  <div>
                    <h4 style={{ fontSize: '0.92rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Theory & Governing Principles</h4>
                    <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{selectedPractical.theory_concepts}</p>
                  </div>
                )}

                {selectedPractical.procedure_steps_parsed?.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.92rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Step-by-Step Procedure</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedPractical.procedure_steps_parsed.map((st, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)' }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                            {st.step || i + 1}
                          </span>
                          <span style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.4 }}>{st.text || String(st)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPractical.safety_guidelines && (
                  <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '0.85rem' }}>
                    <ShieldAlert size={16} style={{ display: 'inline', marginRight: '6px' }} />
                    <strong>Safety & Error Protocol:</strong> {selectedPractical.safety_guidelines}
                  </div>
                )}

                <button onClick={() => setActiveTab('observations')} className="btn btn-primary" style={{ marginTop: '10px' }}>
                  Proceed to Observation & Calculations →
                </button>
              </div>
            )}

            {/* TAB 2: OBSERVATIONS */}
            {activeTab === 'observations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 700, marginBottom: '6px' }}>
                    Observation Table Schema
                  </h4>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {selectedPractical.observations_schema_parsed?.columns?.map((col, idx) => (
                      <span key={idx} className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#38bdf8' }}>
                        {col}
                      </span>
                    ))}
                  </div>
                  <label style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Enter experimental readings, dataset rows, or table observations:
                  </label>
                  <textarea
                    rows={4}
                    value={studentObservations}
                    onChange={(e) => setStudentObservations(e.target.value)}
                    placeholder="e.g. Set 1: V = 0.5V, I = 0.1A -> R = 5.0 Ω&#10;Set 2: V = 1.0V, I = 0.2A -> R = 5.0 Ω..."
                    className="input-field"
                    style={{ fontFamily: 'Consolas, monospace', fontSize: '0.86rem' }}
                  />
                </div>

                {selectedPractical.calculations_formula && (
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 700, marginBottom: '6px' }}>
                      Reduction Formulas / Algorithm Logic
                    </h4>
                    <pre style={{ padding: '12px', borderRadius: '8px', background: '#090d16', border: '1px solid var(--border-subtle)', color: '#38bdf8', fontSize: '0.86rem' }}>
                      {selectedPractical.calculations_formula}
                    </pre>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Your Working Calculations, Code Snippet, or Error Analysis:
                  </label>
                  <textarea
                    rows={4}
                    value={studentCalculations}
                    onChange={(e) => setStudentCalculations(e.target.value)}
                    placeholder="Enter final calculation reduction or Python algorithm code..."
                    className="input-field"
                    style={{ fontFamily: 'Consolas, monospace', fontSize: '0.86rem' }}
                  />
                </div>

                <button onClick={() => setActiveTab('viva')} className="btn btn-primary">
                  Proceed to Oral Viva Voce Exam →
                </button>
              </div>
            )}

            {/* TAB 3: VIVA VOCE */}
            {activeTab === 'viva' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', color: '#67e8f9', fontSize: '0.88rem' }}>
                  🎓 <strong>Oral Viva Voce Practice:</strong> Answer the examiner's oral questions below. Planora will evaluate your technical keywords and grade your experimental comprehension!
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedPractical.viva_questions_parsed?.map((vq, idx) => {
                    const fb = vivaFeedback[idx];
                    return (
                      <div key={idx} style={{ padding: '18px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff' }}>
                          Q{idx + 1}: {vq.q}
                        </div>

                        <textarea
                          rows={2}
                          placeholder="Type your oral viva response here..."
                          value={vivaAnswers[idx] || ''}
                          onChange={(e) => setVivaAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                          className="input-field"
                          style={{ fontSize: '0.85rem' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <button
                            type="button"
                            disabled={evaluatingViva || !vivaAnswers[idx]}
                            onClick={() => handleEvaluateViva(idx, vq.q, vq.a)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Send size={12} /> Evaluate with AI Examiner
                          </button>

                          {fb && (
                            <span className="badge" style={{ background: fb.score_out_of_100 >= 70 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: fb.score_out_of_100 >= 70 ? '#6ee7b7' : '#fca5a5' }}>
                              Score: {fb.score_out_of_100}/100
                            </span>
                          )}
                        </div>

                        {fb && (
                          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', fontSize: '0.82rem', color: '#cbd5e1' }}>
                            <strong>Examiner Verdict:</strong> {fb.verdict}. {fb.feedback}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {attemptSuccess && (
                  <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', fontWeight: 700, fontSize: '0.92rem' }}>
                    ✓ {attemptSuccess}
                  </div>
                )}

                <button
                  disabled={submittingAttempt}
                  onClick={handleSubmitAttempt}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Award size={18} /> {submittingAttempt ? 'Saving Practical Attempt...' : 'Log Complete Attempt & Calculate Exam Readiness'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Practical Generator Modal */}
      {showGenModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
              AI Practical Lab Manual Generator
            </h3>
            <p style={{ margin: '0 0 18px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Synthesizes a complete laboratory experiment guide with apparatus, theory, step-by-step steps, observation schema, and oral viva questions.
            </p>

            <form onSubmit={handleAiGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Experiment or Project Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verification of Bernoulli Theorem, or Dijkstra Algorithm"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Academic Discipline</label>
                <select
                  value={genCategory}
                  onChange={(e) => setGenCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="science">Sciences (Physics, Chemistry, Biology)</option>
                  <option value="computer_science">Computer Science & IT</option>
                  <option value="engineering">Engineering & Technology</option>
                  <option value="commerce">Commerce, Accounting & Economics</option>
                  <option value="humanities">Arts, Humanities & Geography</option>
                  <option value="vocational">Vocational & Industrial Skills</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Academic Level</label>
                <select
                  value={genLevel}
                  onChange={(e) => setGenLevel(e.target.value)}
                  className="input-field"
                >
                  <option value="High School">High School (Grade 11/12)</option>
                  <option value="Undergraduate">Undergraduate (B.Sc / B.Tech / B.Com)</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Vocational">Vocational Diploma / Certification</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowGenModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button
                  type="submit"
                  disabled={generating}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sparkles size={14} /> {generating ? 'Generating with Gemini AI...' : 'Generate Practical'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
