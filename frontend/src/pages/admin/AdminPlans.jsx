import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  BookOpen,
  User,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import StudentDetail from './StudentDetail';

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPlans(search ? `search=${encodeURIComponent(search)}` : '');
      setPlans(res.data?.plans || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPlans();
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px' }}>
            AI Study Plans Portfolio
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Real-time tracking of AI-synthesized deterministic schedules and curriculum timelines.
          </p>
        </div>

        <button
          onClick={loadPlans}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="input"
              placeholder="Search plans by title, student name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '38px', width: '100%' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
            Search
          </button>
        </form>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <RefreshCw size={32} className="animate-spin" style={{ color: '#ef4444', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Retrieving AI study plans...</p>
        </div>
      ) : plans.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {plans.map(plan => {
            const completed = plan.completed_sessions || 0;
            const totalSess = plan.total_sessions || plan.sessions_count || 1;
            const pct = Math.round((completed / totalSess) * 100);
            const planStatus = (plan.status || 'active').toLowerCase();

            return (
              <div
                key={plan.id}
                className="card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      {plan.title}
                    </h3>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: planStatus === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                      color: planStatus === 'active' ? '#34d399' : '#94a3b8'
                    }}>
                      {planStatus.toUpperCase()}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.82rem',
                    color: '#818cf8',
                    marginBottom: '14px'
                  }}>
                    <User size={14} />
                    <span>{plan.student_name} ({plan.student_email})</span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <strong>Timeframe:</strong> {plan.start_date} to {plan.end_date} ({plan.daily_hours}h daily)
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    <strong>Curriculum:</strong> {plan.subjects?.join(', ') || 'General'}
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Completion Progress</span>
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>{completed} / {totalSess} sessions ({pct}%)</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>

                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => setSelectedStudentId(plan.user_id)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  >
                    Inspect Student Record <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          No AI Study Plans found matching criteria.
        </div>
      )}

      {selectedStudentId && (
        <StudentDetail
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
}
