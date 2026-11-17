import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Sparkles,
  Award,
  Flame,
  Zap,
  BookOpen,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  FileText,
  AlertTriangle,
  Play,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AICoreCanvas from '../three/AICoreCanvas';
import AICoreModal from '../components/AICoreModal';
import DynamicRecoveryModal from '../components/DynamicRecoveryModal';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missedSessions, setMissedSessions] = useState([]);
  const [recoverySession, setRecoverySession] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [intelligenceData, setIntelligenceData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, missedRes, intelRes] = await Promise.all([
        api.getDashboard(),
        api.getMissedSessions(),
        api.getIntelligenceOverview().catch(() => null)
      ]);
      setData(dashRes?.data || {});
      const missed = missedRes?.data?.missed_sessions || [];
      setMissedSessions(missed);
      if (missed.length > 0) {
        setRecoverySession(missed[0]);
      }
      if (intelRes?.data) {
        setIntelligenceData(intelRes.data);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (sessionId, action) => {
    try {
      await api.recoverSession(sessionId, action);
      setRecoverySession(null);
      loadDashboard();
      if (action === 'study_now') {
        navigate('/focus');
      }
    } catch (err) {
      alert(err.message || 'Recovery failed');
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      await api.completeSession(sessionId, { actual_minutes: 60, focus_rating: 5 });
      loadDashboard();
    } catch (err) {
      alert(err.message || 'Failed to complete session');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <LoadingSkeleton count={1} height="200px" />
        <div className="grid-3">
          <LoadingSkeleton count={3} height="120px" />
        </div>
      </div>
    );
  }

  const {
    streak = 0,
    xp = 0,
    total_study_hours = 0,
    completed_sessions_count = 0,
    average_quiz_score = 0,
    exam_countdown = {},
    todays_mission = null,
    upcoming_session = null,
    ai_insight = "Keep up the momentum in your revision cycle!",
    exam_readiness = {}
  } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Dynamic Recovery Banner if user missed a session */}
      {recoverySession && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: 'var(--warning)' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
                Missed Session: {recoverySession.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Would you like Planora to dynamically distribute it into your upcoming study sprint?
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleRecover(recoverySession.id, 'study_now')}
              className="btn btn-primary btn-sm"
            >
              Study Now
            </button>
            <button
              onClick={() => handleRecover(recoverySession.id, 'reschedule')}
              className="btn btn-secondary btn-sm"
            >
              Reschedule
            </button>
            <button
              onClick={() => handleRecover(recoverySession.id, 'skip')}
              className="btn btn-outline btn-sm"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Top Hero: 3D AI Core + Today's Mission */}
      <div className="dashboard-hero-grid">
        {/* 3D AI Core Card */}
        <div className="card" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '24px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span className="badge badge-primary">Planora Core 3D</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>Click to trigger</span>
          </div>

          {/* Interactive 3D Three.js Canvas */}
          <AICoreCanvas onClick={() => setAiModalOpen(true)} />

          <div style={{ marginTop: '8px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px' }}>
              Autonomous AI Coach
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Live neural engine monitoring knowledge gaps & exam readiness
            </p>
          </div>

          <button
            onClick={() => setAiModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '16px', width: '100%', borderColor: 'var(--border-highlight)' }}
          >
            <Sparkles size={16} color="var(--primary)" /> Open AI Actions
          </button>
        </div>

        {/* Today's Mission & Exam Countdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Mission Card */}
          <div className="card" style={{ flex: 1, padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-cyan">Today's Mission</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Priority Study Session</span>
              </div>
              {todays_mission && todays_mission.status === 'completed' ? (
                <span className="badge badge-success"><Check size={14} /> Completed</span>
              ) : (
                <span className="badge badge-warning">Action Required</span>
              )}
            </div>

            {todays_mission ? (
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
                  {todays_mission.title}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} color="var(--accent-cyan)" />
                    <span>{new Date(todays_mission.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} color="var(--primary)" />
                    <span>{todays_mission.subject_name || 'Subject'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={16} color="var(--warning)" />
                    <span>{todays_mission.duration_minutes} Minutes</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {todays_mission.status !== 'completed' && (
                    <>
                      <Link
                        to={`/study-hub/${todays_mission.topic_id || 1}`}
                        className="btn btn-primary"
                      >
                        <Play size={16} /> Open Study Hub
                      </Link>
                      <button
                        onClick={() => handleCompleteSession(todays_mission.id)}
                        className="btn btn-secondary"
                      >
                        <CheckCircle size={16} /> Mark Done (+20 XP)
                      </button>
                    </>
                  )}
                  {todays_mission.status === 'completed' && (
                    <Link to="/planner" className="btn btn-secondary">
                      View Next Session <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No session scheduled for today yet.</p>
                <Link to="/planner" className="btn btn-primary">
                  <Calendar size={16} /> Generate Study Schedule
                </Link>
              </div>
            )}
          </div>

          {/* Exam Countdown & AI Insight Row */}
          <div className="split-col-responsive">
            {/* Exam Countdown */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Exam Countdown
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', margin: '8px 0 2px' }}>
                {exam_countdown.days_left !== null && exam_countdown.days_left !== undefined ? exam_countdown.days_left : 28}
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '6px' }}>Days Left</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {exam_countdown.target_name || 'Board Examination'}
              </div>
            </div>

            {/* Telemetry AI Insight */}
            <div className="card" style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px solid var(--border-highlight)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>
                  AI Coach Insight
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                "{ai_insight}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Learning Intelligence Engine Widget */}
      {intelligenceData?.recommendations?.length > 0 && (
        <div className="card" style={{
          padding: '22px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> AI Intelligence Engine
              </span>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                Cognitive Retention Index: <strong style={{ color: '#38bdf8' }}>{intelligenceData.learning_state?.overall_retention_index}%</strong>
              </span>
            </div>
            <Link to="/analytics" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Detailed Gap Analysis →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '14px' }}>
            {intelligenceData.recommendations.slice(0, 3).map((rec, idx) => (
              <div key={idx} style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.94rem' }}>{rec.title}</span>
                  <span className="badge" style={{
                    fontSize: '0.72rem',
                    background: rec.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    color: rec.priority === 'High' ? '#fca5a5' : '#a5b4fc'
                  }}>
                    {rec.priority}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <strong style={{ color: '#a5b4fc' }}>Why:</strong> {rec.why}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                  <Link to={rec.action_link} className="btn btn-primary btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}>
                    {rec.action_label} <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Study Statistics Grid */}
      <div className="grid-4">
        {/* Total Hours */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Study Hours</span>
            <Clock size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 2px' }}>
            {total_study_hours} hrs
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Active learning logged</span>
        </div>

        {/* Completed Sessions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Completed Sessions</span>
            <CheckCircle size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 2px' }}>
            {completed_sessions_count}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Stored in database</span>
        </div>

        {/* Avg Quiz Score */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Quiz Average</span>
            <Award size={18} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 2px' }}>
            {average_quiz_score}%
          </div>
          <span style={{ fontSize: '0.75rem', color: average_quiz_score >= 80 ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
            {average_quiz_score >= 80 ? 'High retention' : 'Revision recommended'}
          </span>
        </div>

        {/* Exam Readiness */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Exam Readiness</span>
            <Sparkles size={18} color="var(--accent-pink)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 2px' }}>
            {exam_readiness.readiness_percentage || 65}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-pink)', fontWeight: 600 }}>
            Calculated score
          </span>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
          Quick Study Actions
        </h3>
        <div className="grid-3">
          <Link to="/planner" className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
              <Calendar size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>Study Planner</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>View & generate smart schedule</div>
            </div>
          </Link>

          <Link to="/doubt-solver" className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
              <HelpCircle size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>AI Doubt Solver</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Scan homework or ask question</div>
            </div>
          </Link>

          <Link to="/pdf-teacher" className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-violet)' }}>
              <FileText size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>PDF Teacher</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Upload notes & extract summaries</div>
            </div>
          </Link>

          <Link to="/quizzes" className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>Take AI Quiz</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Assess retention and earn XP</div>
            </div>
          </Link>

          <Link to="/focus" className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>Deep Focus Mode</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Distraction-free study timer</div>
            </div>
          </Link>

          <Link to="/universe" className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', color: 'var(--accent-pink)' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>Knowledge Universe</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Visual topic dependency map</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Modals */}
      <AICoreModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
      {recoverySession && (
        <DynamicRecoveryModal
          session={recoverySession}
          onRecover={handleRecover}
          onClose={() => setRecoverySession(null)}
        />
      )}
    </div>
  );
}
