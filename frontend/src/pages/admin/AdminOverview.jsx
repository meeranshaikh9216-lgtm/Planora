import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Download,
  RefreshCw,
  Clock,
  BookOpen,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminOverview();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load administrator overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = () => {
    const token = localStorage.getItem('planora_token');
    // Direct browser download with token in query or fetch
    fetch('/api/admin/reports/export-students', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planora_students_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => alert('Failed to export CSV: ' + err.message));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Aggregating system telemetry and student learning records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '24px', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
        <h3 style={{ color: '#f87171', margin: '0 0 8px' }}>Error Loading Overview</h3>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        <button onClick={loadData} className="btn btn-primary" style={{ marginTop: '12px' }}>
          Retry
        </button>
      </div>
    );
  }

  const { metrics, stream_distribution, board_distribution, recent_registrations, recent_plans } = data || {};

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px' }}>
            System Intelligence & Overview
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Real-time verified database metrics across all student cohorts and AI learning modules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={loadData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} /> Refresh
          </button>

          <button
            onClick={handleExportCsv}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              fontWeight: 600,
              border: 'none',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Download size={16} /> Export Student Directory (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Total Students */}
        <div className="card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Total Students
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
            {metrics?.total_students ?? 0}
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{metrics?.students_with_plans ?? 0} actively enrolled in AI plans</span>
          </div>
        </div>

        {/* AI Plans Generated */}
        <div className="card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              AI Study Plans
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
            {metrics?.total_ai_plans ?? 0}
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#94a3b8' }}>
            Calculated via calendar algorithms
          </div>
        </div>

        {/* Study Sessions Completed */}
        <div className="card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Sessions Completed
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
            {metrics?.completed_sessions ?? 0}
            <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500, marginLeft: '6px' }}>
              / {metrics?.total_sessions ?? 0}
            </span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
            {metrics?.session_completion_rate ?? 0}% overall completion rate
          </div>
        </div>

        {/* Practical Attempts */}
        <div className="card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Practical Lab Attempts
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
            {metrics?.total_practical_attempts ?? 0}
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#94a3b8' }}>
            {metrics?.total_focus_sessions ?? 0} focus sessions logged
          </div>
        </div>
      </div>

      {/* Academic Distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Stream Breakdown */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: '0 0 16px' }}>
            Academic Stream Cohorts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stream_distribution && stream_distribution.length > 0 ? (
              stream_distribution.map((item, idx) => {
                const total = metrics?.total_students || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.stream}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.count} students ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #06b6d4)', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No student profiles registered yet.</p>
            )}
          </div>
        </div>

        {/* Board Breakdown */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: '0 0 16px' }}>
            Educational Board Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {board_distribution && board_distribution.length > 0 ? (
              board_distribution.map((item, idx) => {
                const total = metrics?.total_students || 1;
                const pct = Math.round(((item.count || 0) / total) * 100);
                const boardName = item.board || item.class_name || 'General';
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{boardName}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.count || 0} students ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #f59e0b)', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No student profiles registered yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Tables: Recent Students & Recent Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Registrations */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Recent Student Registrations
            </h3>
            <Link to="/admin/students" style={{ color: '#818cf8', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recent_registrations && recent_registrations.length > 0 ? (
              recent_registrations.map(student => (
                <div
                  key={student.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.88rem' }}>
                      {student.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {student.email} • {student.stream || 'General'}
                    </div>
                  </div>
                  <Link
                    to={`/admin/students?inspect=${student.id}`}
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      textDecoration: 'none'
                    }}
                  >
                    Inspect
                  </Link>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent registrations found.</p>
            )}
          </div>
        </div>

        {/* Recent AI Plans */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Active AI Study Plans
            </h3>
            <Link to="/admin/plans" style={{ color: '#818cf8', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recent_plans && recent_plans.length > 0 ? (
              recent_plans.map(plan => {
                const planStatus = (plan.status || 'active').toLowerCase();
                const sessionCount = plan.total_sessions || plan.sessions_count || 0;
                return (
                  <div
                    key={plan.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.88rem' }}>
                        {plan.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Student: {plan.student_name} • {sessionCount} sessions
                      </div>
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: planStatus === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                      color: planStatus === 'active' ? '#34d399' : '#94a3b8'
                    }}>
                      {planStatus.toUpperCase()}
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No AI study plans generated yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
