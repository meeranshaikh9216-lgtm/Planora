import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, Plus, Trash2, Edit3, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [priority, setPriority] = useState('Medium');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignRes, subRes] = await Promise.all([
        api.listAssignments(statusFilter !== 'all' ? `status=${statusFilter}` : ''),
        api.listSubjects()
      ]);
      setAssignments(assignRes.data?.assignments || []);
      setSubjects(subRes.data?.subjects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    try {
      await api.createAssignment({
        title,
        description,
        due_date: dueDate,
        subject_id: subjectId ? parseInt(subjectId) : null,
        priority
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create assignment');
    }
  };

  const handleUpdateProgress = async (id, progress) => {
    try {
      await api.updateAssignment(id, {
        progress_percentage: progress,
        status: progress >= 100 ? 'completed' : 'in_progress'
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.deleteAssignment(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '6px', display: 'inline-block' }}>
            Academic Milestone Manager
          </span>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Assignments & Submission Deadlines
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Track project submissions, homework sheets, and lab report deadlines in one place.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} /> Add Assignment
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['all', 'pending', 'in_progress', 'completed'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className="btn btn-sm"
            style={{
              background: statusFilter === st ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
              color: statusFilter === st ? '#ffffff' : 'var(--text-muted)',
              border: statusFilter === st ? 'none' : '1px solid var(--border-subtle)',
              textTransform: 'capitalize',
              fontWeight: 600
            }}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0 0 6px' }}>No Pending Assignments</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>You're all caught up! Click "Add Assignment" to track a new project deadline.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {assignments.map(a => (
            <div
              key={a.id}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderLeft: a.priority === 'High' ? '4px solid #ef4444' : a.priority === 'Medium' ? '4px solid #f59e0b' : '4px solid #10b981'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#38bdf8' }}>
                  {a.subject_name || 'General Assignment'}
                </span>
                <span className="badge" style={{
                  background: a.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: a.priority === 'High' ? '#fca5a5' : '#fcd34d'
                }}>
                  {a.priority} Priority
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px' }}>
                  {a.title}
                </h3>
                {a.description && (
                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {a.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
                <Clock size={13} /> Due: <strong style={{ color: '#ffffff' }}>{a.due_date}</strong>
              </div>

              {/* Progress Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Completion</span>
                  <span>{a.progress_percentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={a.progress_percentage}
                  onChange={(e) => handleUpdateProgress(a.id, parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => handleUpdateProgress(a.id, a.progress_percentage >= 100 ? 0 : 100)}
                  className="btn btn-sm"
                  style={{
                    background: a.progress_percentage >= 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: a.progress_percentage >= 100 ? 'var(--success)' : '#ffffff',
                    fontSize: '0.8rem',
                    border: 'none'
                  }}
                >
                  {a.progress_percentage >= 100 ? '✓ Completed' : 'Mark 100% Done'}
                </button>

                <button
                  onClick={() => handleDelete(a.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 16px' }}>
              Add Academic Assignment / Deadline
            </h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Chapter 4 Problem Set"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="input-field"
                >
                  <option value="">General (No specific subject)</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="input-field"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Description / Questions Checklist</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Questions 1 to 15 from textbook page 142..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
