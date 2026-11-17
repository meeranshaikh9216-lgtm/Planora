import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Award, CheckCircle, XCircle, ArrowRight, Repeat, RotateCcw, AlertTriangle, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function QuizResult() {
  const { attemptId } = useParams();
  const location = useLocation();
  const [attempt, setAttempt] = useState(location.state?.resultData || null);
  const [loading, setLoading] = useState(!attempt);

  useEffect(() => {
    if (!attempt && attemptId) {
      loadAttempt();
    }
  }, [attemptId]);

  const loadAttempt = async () => {
    try {
      const res = await api.getAttempt(attemptId);
      setAttempt(res.data.attempt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={3} height="100px" />;
  }

  if (!attempt) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Quiz result not found.</p>
        <Link to="/quizzes" className="btn btn-primary">Back to Quizzes</Link>
      </div>
    );
  }

  const score = attempt.score;
  const total = attempt.total_questions;
  const percentage = attempt.percentage;
  const evaluations = attempt.evaluations || attempt.answers || [];

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Score Summary Card */}
      <div className="card" style={{
        padding: '36px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(19, 28, 49, 0.95) 0%, rgba(13, 20, 36, 0.98) 100%)',
        border: '1px solid var(--border-highlight)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: percentage >= 80 ? 'rgba(16, 185, 129, 0.2)' : percentage >= 50 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: percentage >= 80 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <Award size={36} />
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px' }}>
          Quiz Evaluation Complete!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px' }}>
          {attempt.quiz_title || "Planora Assessment"}
        </p>

        {/* Score & Accuracy Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <div style={{
            padding: '16px 28px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Final Score
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff' }}>
              {score} / {total}
            </div>
          </div>

          <div style={{
            padding: '16px 28px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Accuracy
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: percentage >= 80 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
              {percentage}%
            </div>
          </div>
        </div>

        {/* Recommendation Box */}
        <div style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid var(--border-highlight)',
          display: 'inline-block',
          maxWidth: '550px'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '4px' }}>
            Planora Telemetry Analysis:
          </div>
          <div style={{ fontSize: '0.92rem', color: '#ffffff' }}>
            {attempt.recommendation || (percentage >= 80 ? "Concept mastered! Spaced repetition scheduled." : "Knowledge gaps saved into Mistake Bank for targeted practice.")}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '28px' }}>
          <Link to="/mistakes" className="btn btn-secondary">
            <Repeat size={16} /> View Mistake Bank
          </Link>
          <Link to="/quizzes" className="btn btn-primary">
            Take Another Quiz <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Detailed Question Review */}
      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 0' }}>
        Question Review & Step-by-Step Explanations
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {evaluations.map((ev, idx) => {
          const isCorrect = ev.is_correct;
          const options = ev.options || {};

          return (
            <div
              key={idx}
              className="card"
              style={{
                padding: '24px',
                borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                {isCorrect ? (
                  <CheckCircle size={20} color="var(--success)" />
                ) : (
                  <XCircle size={20} color="var(--danger)" />
                )}
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isCorrect ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase' }}>
                  {isCorrect ? 'Correct (+1 Point)' : 'Incorrect (Added to Mistake Bank)'}
                </span>
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', lineHeight: 1.4 }}>
                {ev.question_text}
              </h4>

              {/* Options display */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {['A', 'B', 'C', 'D'].map(optKey => {
                  const text = options[optKey];
                  if (!text) return null;
                  const isSelected = ev.selected_option === optKey;
                  const isAnswer = ev.correct_option === optKey;

                  let bg = 'rgba(255, 255, 255, 0.02)';
                  let border = 'var(--border-subtle)';
                  let color = 'var(--text-muted)';

                  if (isAnswer) {
                    bg = 'rgba(16, 185, 129, 0.15)';
                    border = '1px solid rgba(16, 185, 129, 0.4)';
                    color = '#34d399';
                  } else if (isSelected && !isCorrect) {
                    bg = 'rgba(239, 68, 68, 0.15)';
                    border = '1px solid rgba(239, 68, 68, 0.4)';
                    color = '#f87171';
                  }

                  return (
                    <div
                      key={optKey}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: bg,
                        border,
                        fontSize: '0.88rem',
                        color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <strong style={{ minWidth: '18px' }}>{optKey}:</strong>
                      <span>{text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation note */}
              {ev.explanation && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.45
                }}>
                  <strong style={{ color: '#ffffff' }}>Explanation: </strong>
                  {ev.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
