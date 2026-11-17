import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  Sparkles,
  Clock,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Play,
  RotateCcw,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function Planner() {
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Generate form state
  const [planTitle, setPlanTitle] = useState('Board Exam Sprint');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [dailyHours, setDailyHours] = useState(4.0);
  const [preferredTime, setPreferredTime] = useState('evening');
  const [generating, setGenerating] = useState(false);

  // Manual Add Form State
  const [manualSubjectId, setManualSubjectId] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualStart, setManualStart] = useState('');
  const [manualDuration, setManualDuration] = useState(60);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sessRes, subRes] = await Promise.all([
        api.listSessions(),
        api.listSubjects()
      ]);
      setSessions(sessRes?.data?.sessions || []);
      const subs = subRes?.data?.subjects || [];
      setSubjects(subs);
      if (subs.length > 0) {
        setSelectedSubjectIds(subs.map(s => s.id));
        setManualSubjectId(subs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.generatePlanner({
        title: planTitle,
        subject_ids: selectedSubjectIds,
        daily_hours: dailyHours,
        preferred_time: preferredTime
      });
      setShowGenerateModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to generate schedule');
    } finally {
      setGenerating(false);
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createSession({
        subject_id: manualSubjectId,
        title: manualTitle,
        scheduled_start: manualStart,
        duration_minutes: manualDuration
      });
      setShowAddModal(false);
      setManualTitle('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to add session');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.completeSession(id, { actual_minutes: 60 });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to complete session');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this study session?')) return;
    try {
      await api.deleteSession(id);
      setSessions(sessions.filter(s => s.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleReschedule = async (id) => {
    try {
      await api.recoverSession(id, 'reschedule');
      loadData();
    } catch (err) {
      alert(err.message || 'Reschedule failed');
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} height="80px" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px' }}>
            Study Planner
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Deterministic timetable generation, dynamic recovery, and topic tracking
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowGenerateModal(true)} className="btn btn-primary">
            <Sparkles size={18} /> AI Generate Schedule
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-secondary">
            <Plus size={18} /> Add Manual Session
          </button>
        </div>
      </div>

      {/* Sessions Timeline List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {sessions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
            <CalendarIcon size={40} color="var(--primary)" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              No study sessions scheduled yet
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
              Use the AI Schedule Generator to automatically create conflict-free study sessions across your subjects.
            </p>
            <button onClick={() => setShowGenerateModal(true)} className="btn btn-primary">
              <Sparkles size={18} /> Generate Schedule Now
            </button>
          </div>
        ) : (
          sessions.map((sess) => {
            const isCompleted = sess.status === 'completed';
            const isMissed = sess.status === 'missed';
            const startDate = new Date(sess.scheduled_start);

            return (
              <div
                key={sess.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 24px',
                  gap: '16px',
                  flexWrap: 'wrap',
                  borderLeft: `4px solid ${isCompleted ? 'var(--success)' : isMissed ? 'var(--danger)' : (sess.subject_color || 'var(--primary)')}`
                }}
              >
                {/* Time & Subject Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    minWidth: '95px',
                    textAlign: 'center',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        className="badge"
                        style={{
                          background: `${sess.subject_color || '#6366f1'}20`,
                          color: sess.subject_color || '#818cf8',
                          border: `1px solid ${sess.subject_color || '#6366f1'}40`
                        }}
                      >
                        {sess.subject_name || 'Subject'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {sess.duration_minutes} mins
                      </span>
                    </div>

                    <h4 style={{
                      margin: 0,
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: isCompleted ? 'var(--text-muted)' : '#ffffff',
                      textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>
                      {sess.title}
                    </h4>
                  </div>
                </div>

                {/* Session Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!isCompleted && sess.topic_id && (
                    <Link
                      to={`/study-hub/${sess.topic_id}`}
                      className="btn btn-primary btn-sm"
                      title="Open Study Hub for this topic"
                    >
                      <Play size={14} /> Study
                    </Link>
                  )}

                  {!isCompleted ? (
                    <button
                      onClick={() => handleComplete(sess.id)}
                      className="btn btn-secondary btn-sm"
                      title="Mark Complete (+20 XP)"
                    >
                      <CheckCircle size={15} color="var(--success)" /> Done
                    </button>
                  ) : (
                    <span className="badge badge-success">
                      <Check size={14} /> Completed
                    </span>
                  )}

                  {!isCompleted && (
                    <button
                      onClick={() => handleReschedule(sess.id)}
                      className="btn btn-outline btn-sm"
                      title="Shift to tomorrow"
                    >
                      <RotateCcw size={14} /> Reschedule
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(sess.id)}
                    className="btn btn-outline btn-sm"
                    style={{ color: 'var(--text-dim)' }}
                    title="Delete session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Schedule Generator Modal */}
      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
              Generate AI Study Plan
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Combines Python deterministic slot-allocation with prerequisite sequencing.
            </p>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Sprint Title</label>
                <input
                  type="text"
                  className="input"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Subjects to Include</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {subjects.map(s => {
                    const sel = selectedSubjectIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (sel) setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== s.id));
                          else setSelectedSubjectIds([...selectedSubjectIds, s.id]);
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '999px',
                          border: sel ? `1px solid ${s.color}` : '1px solid var(--border-subtle)',
                          background: sel ? `${s.color}25` : 'rgba(255, 255, 255, 0.04)',
                          color: sel ? '#ffffff' : 'var(--text-muted)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Daily Study Target</label>
                  <select className="select" value={dailyHours} onChange={(e) => setDailyHours(parseFloat(e.target.value))}>
                    <option value={2.0}>2 Hours / day</option>
                    <option value={3.0}>3 Hours / day</option>
                    <option value={4.0}>4 Hours / day</option>
                    <option value={5.5}>5.5 Hours / day</option>
                  </select>
                </div>
                <div>
                  <label className="label">Preferred Window</label>
                  <select className="select" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)}>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowGenerateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={generating || selectedSubjectIds.length === 0}>
                  {generating ? 'Calculating Schedule...' : 'Generate 2-Week Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Add Session Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
              Add Manual Study Session
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Create a custom scheduled study block in your timetable.
            </p>

            <form onSubmit={handleManualAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Subject</label>
                <select className="select" value={manualSubjectId} onChange={(e) => setManualSubjectId(e.target.value)} required>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Session Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Mathematics: Differential Equations Solving"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Scheduled Start</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={manualStart}
                    onChange={(e) => setManualStart(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Duration (minutes)</label>
                  <input
                    type="number"
                    className="input"
                    min="15"
                    max="240"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
