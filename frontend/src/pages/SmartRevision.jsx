import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Repeat, Calendar, CheckCircle, Clock, Award, ArrowRight, Check } from 'lucide-react';
import { api } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function SmartRevision() {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending', 'due_today', 'completed', 'all'

  useEffect(() => {
    loadRevisions();
  }, [filter]);

  const loadRevisions = async () => {
    setLoading(true);
    try {
      let params = '';
      if (filter === 'due_today') {
        params = 'due_today=true';
      } else if (filter !== 'all') {
        params = `status=${filter}`;
      }
      const res = await api.listRevisions(params);
      setRevisions(res?.data?.revisions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.completeRevision(id, 90.0);
      loadRevisions();
    } catch (err) {
      alert(err.message || 'Failed to complete revision');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Repeat size={24} color="var(--primary)" /> Smart Spaced Revision
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Ebbinghaus forgetting curve intervals (1, 3, 7, 15, 30 days) automated from your study telemetry.
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'due_today', label: 'Due Today' },
            { id: 'completed', label: 'Completed' },
            { id: 'all', label: 'All Intervals' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="80px" />
      ) : revisions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <Repeat size={36} color="var(--primary)" style={{ marginBottom: '14px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            No revisions in this filter
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Whenever you complete a study session or quiz, Planora automatically queues spaced revisions.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {revisions.map(rev => {
            const isCompleted = rev.status === 'completed';
            const scheduled = new Date(rev.scheduled_date);
            const isToday = scheduled.toDateString() === new Date().toDateString();

            return (
              <div
                key={rev.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 24px',
                  gap: '16px',
                  flexWrap: 'wrap',
                  borderLeft: `4px solid ${isCompleted ? 'var(--success)' : isToday ? 'var(--warning)' : (rev.subject_color || 'var(--primary)')}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    minWidth: '85px',
                    textAlign: 'center',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Interval
                    </span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                      +{rev.interval_day}d
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge" style={{ background: `${rev.subject_color || '#6366f1'}20`, color: rev.subject_color || '#818cf8' }}>
                        {rev.subject_name || 'Subject'}
                      </span>
                      {isToday && !isCompleted && (
                        <span className="badge badge-warning">Due Today</span>
                      )}
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                      {rev.topic_name}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Scheduled: {scheduled.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Link to={`/study-hub/${rev.topic_id}`} className="btn btn-secondary btn-sm">
                    Open Hub <ArrowRight size={14} />
                  </Link>
                  {!isCompleted ? (
                    <button onClick={() => handleComplete(rev.id)} className="btn btn-primary btn-sm">
                      <CheckCircle size={15} /> Mark Revised
                    </button>
                  ) : (
                    <span className="badge badge-success"><Check size={14} /> Mastered</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
