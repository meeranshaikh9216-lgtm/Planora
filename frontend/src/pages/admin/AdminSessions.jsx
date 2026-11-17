import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  RefreshCw,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import StudentDetail from './StudentDetail';

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [counts, setCounts] = useState({ total: 0, completed: 0, scheduled: 0, missed: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        status: statusFilter,
        search: search.trim()
      }).toString();

      const res = await api.getAdminSessions(params);
      setSessions(res.data?.sessions || []);
      setCounts(res.data?.counts || { total: 0, completed: 0, scheduled: 0, missed: 0 });
      setTotalCount(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to load study sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadSessions();
  };

  const getStatusBadge = (status) => {
    const s = (status || 'scheduled').toLowerCase();
    if (s === 'completed') {
      return {
        bg: 'rgba(16, 185, 129, 0.15)',
        color: '#34d399',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        label: 'COMPLETED'
      };
    }
    if (s === 'missed') {
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        label: 'MISSED'
      };
    }
    return {
      bg: 'rgba(59, 130, 246, 0.15)',
      color: '#60a5fa',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      label: 'SCHEDULED'
    };
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
            Study Sessions Central Ledger
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Live institutional inspection of student study schedules, active durations, and completion telemetry.
          </p>
        </div>

        <button
          onClick={loadSessions}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Total Sessions</span>
            <Calendar size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
            {counts.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Across all AI study plans</div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Completed</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
            {counts.completed}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
            {counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0}% completion rate
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Scheduled / Pending</span>
            <Clock size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa' }}>
            {counts.scheduled}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Upcoming scheduled blocks</div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Missed</span>
            <AlertTriangle size={18} color="#f87171" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171' }}>
            {counts.missed}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Required schedule rebalancing</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'all', label: 'All Sessions' },
              { id: 'scheduled', label: 'Scheduled' },
              { id: 'completed', label: 'Completed' },
              { id: 'missed', label: 'Missed' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: statusFilter === tab.id ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: statusFilter === tab.id ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: statusFilter === tab.id ? '#fca5a5' : '#94a3b8'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', minWidth: '320px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="input"
                placeholder="Search session title, subject, or student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%', fontSize: '0.85rem' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>Session Title</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>Student</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>Subject</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>Scheduled Time</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>Duration</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '50px' }}>
                    <RefreshCw size={28} className="animate-spin" style={{ color: '#ef4444', margin: '0 auto 10px' }} />
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Querying session records...</p>
                  </td>
                </tr>
              ) : sessions.length > 0 ? (
                sessions.map(s => {
                  const badge = getStatusBadge(s.status);
                  const dtStr = s.scheduled_start ? new Date(s.scheduled_start).toLocaleString() : 'N/A';
                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>{s.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Session #{s.id}</div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{s.student_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.student_email}</div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: '#a5b4fc',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}>
                          {s.subject || 'General'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                        {dtStr}
                      </td>

                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {s.duration_minutes} mins
                        {s.actual_duration_minutes ? ` (${s.actual_duration_minutes} actual)` : ''}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: badge.bg,
                          color: badge.color,
                          border: badge.border
                        }}>
                          {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedStudentId(s.user_id)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#ffffff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          Inspect <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No study sessions found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div>Showing {sessions.length} of {totalCount} total session records</div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-secondary"
              style={{ padding: '6px 12px' }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ padding: '6px 12px', fontWeight: 600, color: '#ffffff' }}>Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={sessions.length < 20}
              className="btn btn-secondary"
              style={{ padding: '6px 12px' }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Student Modal */}
      {selectedStudentId && (
        <StudentDetail
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
}
