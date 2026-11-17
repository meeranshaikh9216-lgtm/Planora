import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  FileText,
  Award,
  Repeat,
  Video,
  HelpCircle,
  Eye,
  CheckCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  Flame,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function StudyHub() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explain');

  // AI Explain State
  const [explainMode, setExplainMode] = useState('standard');
  const [explanation, setExplanation] = useState(null);
  const [explaining, setExplaining] = useState(false);

  // Visual Breakdown State
  const [visualData, setVisualData] = useState(null);
  const [visualLoading, setVisualLoading] = useState(false);

  // Flashcards state
  const [flippedCardId, setFlippedCardId] = useState(null);

  // Quick Ask AI input
  const [quickQuestion, setQuickQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [askingAi, setAskingAi] = useState(false);

  useEffect(() => {
    loadHub();
  }, [topicId]);

  const loadHub = async () => {
    const id = topicId || 1;
    setLoading(true);
    try {
      const res = await api.getStudyHub(id);
      setHubData(res.data);
      // Auto fetch explanation
      fetchExplanation(res.data?.topic?.name, res.data?.topic?.subject_name, 'standard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExplanation = async (topicName, subjectName, mode) => {
    setExplaining(true);
    try {
      const res = await api.explainTopic({
        topic: topicName,
        subject: subjectName,
        mode: mode
      });
      setExplanation(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setExplaining(false);
    }
  };

  const handleModeChange = (mode) => {
    setExplainMode(mode);
    if (hubData?.topic) {
      fetchExplanation(hubData.topic.name, hubData.topic.subject_name, mode);
    }
  };

  const [generatingCards, setGeneratingCards] = useState(false);

  const loadVisualExplanation = async (force = false) => {
    if ((visualData && !force) || !hubData?.topic) return;
    setVisualLoading(true);
    try {
      const res = await api.visualExplanation({
        topic: hubData.topic.name,
        subject: hubData.topic.subject_name
      });
      setVisualData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setVisualLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!hubData?.topic) return;
    setGeneratingCards(true);
    try {
      const res = await api.generateFlashcards({
        topic_id: hubData.topic.id,
        subject_id: hubData.topic.subject_id,
        count: 5
      });
      const newCards = res.data?.flashcards || [];
      setHubData(prev => ({
        ...prev,
        flashcards: [...newCards, ...(prev.flashcards || [])]
      }));
      setActiveTab('flashcards');
    } catch (err) {
      alert(err.message || 'Flashcards generation failed');
    } finally {
      setGeneratingCards(false);
    }
  };

  const handleQuickAsk = async (e) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    setAskingAi(true);
    try {
      const res = await api.chatTutor({
        message: `Regarding topic ${hubData?.topic?.name}: ${quickQuestion}`,
        topic_id: hubData?.topic?.id
      });
      setAiAnswer(res?.data?.reply || '');
    } catch (err) {
      alert(err.message || 'AI request failed');
    } finally {
      setAskingAi(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (!hubData?.topic) return;
    try {
      const res = await api.generateNotes({
        topic_id: hubData.topic.id,
        subject_id: hubData.topic.subject_id
      });
      setHubData(prev => ({ ...prev, notes: [res.data.note, ...(prev.notes || [])] }));
      setActiveTab('notes');
    } catch (err) {
      alert(err.message || 'Notes generation failed');
    }
  };

  const handleCardMastery = async (cardId, mastery) => {
    try {
      await api.reviewFlashcard(cardId, mastery);
      setHubData(prev => ({
        ...prev,
        flashcards: prev.flashcards.map(c => c.id === cardId ? { ...c, mastery_level: mastery } : c)
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} height="90px" />;
  }

  const topic = hubData?.topic || {};
  const notes = hubData?.notes || [];
  const flashcards = hubData?.flashcards || [];
  const mistakes = hubData?.mistakes || [];
  const videos = hubData?.recommended_videos || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Topic Hero Card */}
      <div className="card" style={{
        padding: '30px',
        background: 'linear-gradient(135deg, rgba(19, 28, 49, 0.9) 0%, rgba(13, 20, 36, 0.95) 100%)',
        border: '1px solid var(--border-highlight)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge" style={{ background: `${topic.subject_color || '#6366f1'}25`, color: topic.subject_color || '#818cf8' }}>
                {topic.subject_name}
              </span>
              <span className="badge badge-cyan">{topic.chapter}</span>
              <span className={`badge ${topic.difficulty === 'Hard' ? 'badge-danger' : topic.difficulty === 'Easy' ? 'badge-success' : 'badge-warning'}`}>
                {topic.difficulty} Difficulty
              </span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
              {topic.name}
            </h1>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: '650px' }}>
              {topic.description || 'Master fundamental principles, problem decomposing techniques, and high-yield examination tips.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to={`/quizzes?topic_id=${topic.id}`} className="btn btn-primary btn-sm">
              <Award size={16} /> Take Quiz
            </Link>
            <Link to="/focus" className="btn btn-secondary btn-sm">
              <Clock size={16} /> Focus Session
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          marginTop: '28px',
          overflowX: 'auto'
        }}>
          {[
            { id: 'explain', label: 'Explain Concept', icon: Sparkles },
            { id: 'notes', label: `Notes (${notes.length})`, icon: FileText },
            { id: 'visual', label: 'Explain Visually', icon: Eye },
            { id: 'flashcards', label: `Flashcards (${flashcards.length})`, icon: Layers },
            { id: 'mistakes', label: `Mistakes (${mistakes.length})`, icon: Repeat },
            { id: 'videos', label: 'Videos', icon: Video },
            { id: 'ask_ai', label: 'Ask AI Tutor', icon: HelpCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'visual') loadVisualExplanation();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: active ? 'var(--primary)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: EXPLAIN */}
      {activeTab === 'explain' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Explanation Style:
            </span>
            {[
              { id: 'standard', label: 'Standard Depth' },
              { id: 'simplified', label: 'Simplify (ELI5)' },
              { id: 'step_by_step', label: 'Step-by-Step Method' },
              { id: 'teach_me_back', label: 'Teach Me Back' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className={`btn btn-sm ${explainMode === m.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {explaining ? (
            <LoadingSkeleton count={3} height="100px" />
          ) : explanation ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                  {explanation.title || topic.name}
                </h3>
                <p style={{ fontSize: '0.96rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  {explanation.summary}
                </p>
              </div>

              {/* Core Concepts */}
              {explanation.core_concepts && explanation.core_concepts.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '10px' }}>
                    Core Key Concepts
                  </h4>
                  <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {explanation.core_concepts.map((cc, i) => (
                      <li key={i} style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>{cc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step by step */}
              {explanation.step_by_step_breakdown && explanation.step_by_step_breakdown.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '10px' }}>
                    Procedural Step-by-Step Execution
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {explanation.step_by_step_breakdown.map((st, i) => (
                      <div key={i} style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.9rem',
                        color: 'var(--text-main)'
                      }}>
                        {st}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulas */}
              {explanation.key_formulas && explanation.key_formulas.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f59e0b', marginBottom: '10px' }}>
                    Key Mathematical / Scientific Formulas
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
                    {explanation.key_formulas.map((f, i) => (
                      <div key={i} style={{
                        padding: '14px',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <div style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>{f.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#ffffff', margin: '4px 0' }}>
                          {f.formula}
                        </div>
                        {f.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pro Tip */}
              {explanation.pro_tip && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Flame size={20} color="var(--success)" />
                  <div style={{ fontSize: '0.88rem', color: '#a7f3d0' }}>
                    <strong>Exam Pro Tip:</strong> {explanation.pro_tip}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: NOTES */}
      {activeTab === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>Study Notes</h3>
            <button onClick={handleGenerateNotes} className="btn btn-primary btn-sm">
              <Sparkles size={16} /> Generate New AI Notes
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No notes stored for this topic yet.</p>
              <button onClick={handleGenerateNotes} className="btn btn-primary">
                <Sparkles size={16} /> Auto-Generate High-Yield Notes
              </button>
            </div>
          ) : (
            notes.map(n => (
              <div key={n.id} className="card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  {n.title}
                </h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {n.summary}
                </p>

                {n.key_points && n.key_points.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                      Key Points
                    </div>
                    <ul style={{ paddingLeft: '20px', color: 'var(--text-main)', fontSize: '0.88rem' }}>
                      {n.key_points.map((kp, idx) => <li key={idx}>{kp}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: VISUAL EXPLANATION */}
      {activeTab === 'visual' && (
        <div className="card" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px' }}>
                Visual Concept Blueprint: {topic.name}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                AI-synthesized mental models, geometric transformations, and core formulas powered by Gemini.
              </p>
            </div>
            <button
              onClick={() => loadVisualExplanation(true)}
              disabled={visualLoading}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Sparkles size={16} color="var(--primary)" />
              {visualLoading ? 'Synthesizing...' : 'Regenerate Visual Model'}
            </button>
          </div>

          {visualLoading ? (
            <div style={{ marginTop: '24px' }}>
              <LoadingSkeleton count={3} height="85px" />
            </div>
          ) : visualData ? (
            <div style={{ marginTop: '24px' }}>
              {/* Intuitive Mental Model / Analogy */}
              {visualData.mental_model_analogy && (
                <div style={{
                  padding: '20px 24px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  marginBottom: '24px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8', fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>
                    <Sparkles size={18} />
                    <span>Intuitive Mental Model & Real-World Analogy</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                    {visualData.mental_model_analogy}
                  </p>
                </div>
              )}

              {/* Core Equation Banner */}
              {visualData.core_equation && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 20px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '24px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Core Governing Equation:
                  </span>
                  <code style={{ fontSize: '1.05rem', color: '#ffffff', fontWeight: 800, background: 'rgba(0, 0, 0, 0.3)', padding: '4px 12px', borderRadius: '6px' }}>
                    {visualData.core_equation}
                  </code>
                </div>
              )}

              {/* Step-by-Step Visual Transformation Pipeline */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                  Step-by-Step Transformation Pipeline
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {visualData.stages?.map((st) => (
                    <div
                      key={st.step}
                      style={{
                        padding: '20px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}>
                          {st.step}
                        </div>
                        {st.formula_or_symbol && (
                          <span style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#a5b4fc',
                            fontFamily: 'Consolas, monospace'
                          }}>
                            {st.formula_or_symbol}
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.98rem' }}>{st.label}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{st.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ASCII / Geometric Flow Chart */}
              {visualData.ascii_diagram && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Visual Flow / Geometric Blueprint
                  </div>
                  <pre style={{
                    background: '#090d16',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    color: '#38bdf8',
                    fontFamily: 'Consolas, "Courier New", monospace',
                    fontSize: '0.92rem',
                    overflowX: 'auto',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {visualData.ascii_diagram}
                  </pre>
                </div>
              )}

              {/* Key Takeaway */}
              {visualData.key_takeaway && (
                <div style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.92rem',
                  lineHeight: 1.5
                }}>
                  💡 <strong>Exam Visual Rule:</strong> {visualData.key_takeaway}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 4: FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                Active Recall Flashcards ({flashcards.length})
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Test your conceptual memory with interactive cards and spaced repetition.
              </p>
            </div>
            <button
              onClick={handleGenerateFlashcards}
              disabled={generatingCards}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Sparkles size={16} />
              {generatingCards ? 'Generating with AI...' : '+ Generate 5 AI Flashcards'}
            </button>
          </div>

          {flashcards.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Layers size={32} color="var(--primary)" />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                No Flashcards for {topic.name} Yet
              </h4>
              <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px', fontSize: '0.92rem' }}>
                Ask Gemini AI to synthesize 5 high-yield active recall flashcards covering definitions, formulas, and tricky exam traps for this topic.
              </p>
              <button
                onClick={handleGenerateFlashcards}
                disabled={generatingCards}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
              >
                <Sparkles size={18} />
                {generatingCards ? 'Generating Flashcards with AI...' : 'Generate 5 AI Flashcards'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
              {flashcards.map(c => {
                const isFlipped = flippedCardId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`flip-card ${isFlipped ? 'flipped' : ''}`}
                    onClick={() => setFlippedCardId(isFlipped ? null : c.id)}
                  >
                    <div className="flip-card-inner">
                      <div className="flip-card-front">
                        <span className="badge badge-primary" style={{ marginBottom: '14px' }}>Question (Click to flip)</span>
                        <p style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.4 }}>{c.front_text || c.front}</p>
                      </div>
                      <div className="flip-card-back">
                        <span className="badge badge-cyan" style={{ marginBottom: '14px' }}>Answer</span>
                        <p style={{ fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '16px' }}>{c.back_text || c.back}</p>
                        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleCardMastery(c.id, 'known')} className="btn btn-secondary btn-sm" style={{ color: 'var(--success)' }}>
                            Know It
                          </button>
                          <button onClick={() => handleCardMastery(c.id, 'need_revision')} className="btn btn-secondary btn-sm" style={{ color: 'var(--warning)' }}>
                            Revise
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MISTAKES */}
      {activeTab === 'mistakes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
            Mistake Bank for {topic.name}
          </h3>
          {mistakes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <CheckCircle size={36} color="var(--success)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-muted)' }}>No active mistakes recorded for this topic. Clean sheet!</p>
            </div>
          ) : (
            mistakes.map(m => (
              <div key={m.id} className="card" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  {m.question_text}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#f87171', marginBottom: '4px' }}>
                  <strong>Your past answer:</strong> {m.student_answer}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#34d399', marginBottom: '8px' }}>
                  <strong>Correct answer:</strong> {m.correct_answer}
                </div>
                {m.explanation && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    <strong>Explanation:</strong> {m.explanation}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 6: VIDEOS */}
      {activeTab === 'videos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
            Curated Video Recommendations
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            High-yield educational video search links designed to jumpstart conceptual understanding.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
            {videos.map((v, i) => (
              <a
                key={i}
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="card"
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-warning">{v.type}</span>
                  <ExternalLink size={16} color="var(--text-muted)" />
                </div>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{v.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{v.channel}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: ASK AI */}
      {activeTab === 'ask_ai' && (
        <div className="card" style={{ padding: '26px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
            Ask AI Tutor About {topic.name}
          </h3>
          <form onSubmit={handleQuickAsk} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              className="input"
              placeholder="e.g. Explain how to apply substitution in question 5..."
              value={quickQuestion}
              onChange={(e) => setQuickQuestion(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={askingAi} style={{ flexShrink: 0 }}>
              {askingAi ? 'Thinking...' : 'Ask Tutor'}
            </button>
          </form>

          {aiAnswer && (
            <div style={{
              padding: '18px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-highlight)',
              color: 'var(--text-main)',
              lineHeight: 1.6,
              fontSize: '0.94rem'
            }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>AI Tutor:</div>
              {aiAnswer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
