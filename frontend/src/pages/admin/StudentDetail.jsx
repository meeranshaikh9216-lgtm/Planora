import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Layers,
  FlaskConical,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

export default function StudentDetail({ studentId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sessions' | 'practicals' | 'quizzes' | 'mistakes'

  useEffect(() => {
    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  const loadStudent = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminStudentDetail(studentId);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve detailed student record.');
    } finally {
      setLoading(false);
    }
  };

  if (!studentId) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '24px'
    }}>
      <div style={{
        background: '#0d1322',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {data?.student?.name || 'Student Profile'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {data?.student?.email} • ID: #{studentId}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <RefreshCw size={32} className="animate-spin" style={{ color: '#ef4444', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Retrieving comprehensive academic and telemetry logs...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '10px' }}>
              {error}
            </div>
          ) : data ? (
            <div>
              {/* Profile Card & KPI metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Stream & Board</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
                    {data.profile?.stream || 'Not Set'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>{data.profile?.board || 'N/A'} • {data.profile?.grade_class}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Session Progress</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                    {data.metrics?.completed_sessions} / {data.metrics?.total_sessions}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{data.metrics?.completion_rate}% Completion</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Practical Readiness</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                    {data.metrics?.average_practical_readiness}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{data.metrics?.practicals_attempted} experiments</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Mistake Bank</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: data.metrics?.active_mistakes_count > 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
                    {data.metrics?.active_mistakes_count} Unresolved
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{data.metrics?.total_focus_minutes} focus mins</div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '12px',
                marginBottom: '20px'
              }}>
                {[
                  { id: 'overview', label: 'AI Study Plans' },
                  { id: 'sessions', label: 'Study Sessions' },
                  { id: 'practicals', label: 'Practical Labs' },
                  { id: 'mistakes', label: 'Mistakes Log' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: activeTab === tab.id ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      color: activeTab === tab.id ? '#fca5a5' : '#94a3b8',
                      border: activeTab === tab.id ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: AI Study Plans */}
              {activeTab === 'overview' && (
                <div>
                  <h4 style={{ color: '#ffffff', margin: '0 0 12px', fontSize: '0.95rem' }}>Active AI Study Schedules</h4>
                  {data.plans && data.plans.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {data.plans.map(p => (
                        <div key={p.id} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{p.title}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>{p.status}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Duration: {p.start_date} to {p.end_date} • Daily Hours: {p.daily_hours} hrs
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#818cf8', marginTop: '4px' }}>
                            Subjects: {p.subjects?.join(', ') || 'General Curriculum'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No AI Study Plans generated by this student yet.</p>
                  )}
                </div>
              )}

              {/* Tab 2: Study Sessions */}
              {activeTab === 'sessions' && (
                <div>
                  <h4 style={{ color: '#ffffff', margin: '0 0 12px', fontSize: '0.95rem' }}>Recent Study Sessions</h4>
                  {data.recent_sessions && data.recent_sessions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {data.recent_sessions.map(s => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>{s.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {s.subject} • {new Date(s.scheduled_start).toLocaleString()} • {s.duration_minutes} min
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: s.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : s.status === 'missed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                            color: s.status === 'completed' ? '#34d399' : s.status === 'missed' ? '#f87171' : '#94a3b8'
                          }}>
                            {(s.status || 'scheduled').toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No sessions logged.</p>
                  )}
                </div>
              )}

              {/* Tab 3: Practicals */}
              {activeTab === 'practicals' && (
                <div>
                  <h4 style={{ color: '#ffffff', margin: '0 0 12px', fontSize: '0.95rem' }}>Practical Lab Submissions</h4>
                  {data.recent_practicals && data.recent_practicals.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {data.recent_practicals.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>{p.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Viva Score: {p.viva_score}%</div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399' }}>
                            {p.readiness_percentage}% Readiness
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No practical experiments attempted yet.</p>
                  )}
                </div>
              )}

              {/* Tab 4: Mistakes Log */}
              {activeTab === 'mistakes' && (
                <div>
                  <h4 style={{ color: '#ffffff', margin: '0 0 12px', fontSize: '0.95rem' }}>Mistake Bank Records</h4>
                  {data.mistakes && data.mistakes.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {data.mistakes.map(m => (
                        <div key={m.id} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>{m.question}</div>
                          <div style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '4px' }}>
                            Wrong: {m.user_answer} | Correct: {m.correct_answer}
                          </div>
                          {m.explanation && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              AI Guidance: {m.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active mistakes in bank. Great job!</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
