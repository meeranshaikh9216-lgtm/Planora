import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Sparkles, CheckCircle, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function MistakeBank() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterResolved, setFilterResolved] = useState('unresolved'); // 'unresolved', 'resolved', 'all'
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  useEffect(() => {
    loadMistakes();
  }, [filterResolved]);

  const loadMistakes = async () => {
    setLoading(true);
    try {
      let params = '';
      if (filterResolved === 'unresolved') params = 'is_resolved=false';
      else if (filterResolved === 'resolved') params = 'is_resolved=true';

      const res = await api.listMistakes(params);
      setMistakes(res?.data?.mistakes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResolve = async (id, currentStatus) => {
    try {
      await api.resolveMistake(id, !currentStatus);
      loadMistakes();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleGenerateMistakeQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const res = await api.generateMistakeQuiz();
      navigate('/quizzes', { state: { autoPlayQuizId: res.data.quiz.id } });
    } catch (err) {
      alert(err.message || 'No mistakes available for quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={24} color="var(--danger)" /> Mistake Bank
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Empirical repository of quiz errors, calculation traps, and misconception recurrence tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleGenerateMistakeQuiz}
            className="btn btn-primary"
            disabled={generatingQuiz || mistakes.length === 0}
          >
            <Sparkles size={16} /> {generatingQuiz ? 'Generating Quiz...' : 'Quiz from Mistakes'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setFilterResolved('unresolved')}
          className={`btn btn-sm ${filterResolved === 'unresolved' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Active Mistakes ({mistakes.filter(m => !m.is_resolved).length})
        </button>
        <button
          onClick={() => setFilterResolved('resolved')}
          className={`btn btn-sm ${filterResolved === 'resolved' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Resolved Archive
        </button>
        <button
          onClick={() => setFilterResolved('all')}
          className={`btn btn-sm ${filterResolved === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Recorded
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="110px" />
      ) : mistakes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CheckCircle size={44} color="var(--success)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            Mistake Bank is Empty!
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
            When you take quizzes or practice problems, any incorrect answers are automatically analyzed and cataloged here for revision.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mistakes.map(m => (
            <div
              key={m.id}
              className="card"
              style={{
                padding: '24px',
                borderLeft: `4px solid ${m.is_resolved ? 'var(--success)' : 'var(--danger)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-primary">{m.subject_name}</span>
                  {m.topic_name && <span className="badge badge-cyan">{m.topic_name}</span>}
                  <span className="badge badge-danger">
                    Incorrect {m.recurrence_count} {m.recurrence_count === 1 ? 'time' : 'times'}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleResolve(m.id, m.is_resolved)}
                  className={`btn btn-sm ${m.is_resolved ? 'btn-secondary' : 'btn-outline'}`}
                  style={{ color: m.is_resolved ? 'var(--success)' : 'var(--text-muted)' }}
                >
                  <CheckCircle size={15} />
                  {m.is_resolved ? 'Resolved' : 'Mark Resolved'}
                </button>
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1.4 }}>
                {m.question_text}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '0.88rem'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>Your Answer</div>
                  <div style={{ color: '#ffffff', marginTop: '2px' }}>{m.student_answer || 'Incorrect selection'}</div>
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '0.88rem'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>Correct Formulation</div>
                  <div style={{ color: '#ffffff', marginTop: '2px' }}>{m.correct_answer}</div>
                </div>
              </div>

              {m.explanation && (
                <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.45, background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ color: 'var(--accent-cyan)' }}>AI Reasoning: </strong>
                  {m.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
