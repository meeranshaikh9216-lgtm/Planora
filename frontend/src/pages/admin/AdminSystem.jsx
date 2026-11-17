import React, { useState, useEffect } from 'react';
import {
  Activity,
  Bell,
  Database,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  ShieldCheck,
  Zap,
  Volume2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function AdminSystem() {
  const [monitor, setMonitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [triggering, setTriggering] = useState(false);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminRemindersMonitor();
      setMonitor(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleSyncReminders = async () => {
    setTriggering(true);
    setActionMsg('');
    try {
      const res = await api.syncSessionReminders();
      setActionMsg(res.message || 'Alarms synchronized.');
      loadHealth();
    } catch (err) {
      setActionMsg('Sync error: ' + err.message);
    } finally {
      setTriggering(false);
    }
  };

  const handleTestAlarm = async () => {
    setTriggering(true);
    setActionMsg('');
    try {
      const res = await api.testAlarm();
      setActionMsg('Test alarm scheduled: ' + (res.data?.reminder?.title || 'Done'));
      loadHealth();
    } catch (err) {
      setActionMsg('Error creating test alarm: ' + err.message);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
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
            System Infrastructure & Alarm Monitor
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Diagnostics for background reminder engines, notification dispatchers, and database integrity.
          </p>
        </div>

        <button
          onClick={loadHealth}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {actionMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          marginBottom: '20px',
          fontSize: '0.88rem'
        }}>
          {actionMsg}
        </div>
      )}

      {/* Monitor Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Pending Reminders
            </span>
            <Bell size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            {monitor?.counts?.pending ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Scheduled for automatic audio dispatch
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Delivered Alarms
            </span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            {monitor?.counts?.delivered ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '6px' }}>
            Successfully dispatched to students
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Total Alarms In Database
            </span>
            <Activity size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            {monitor?.total_reminders ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Across all active user study plans
          </div>
        </div>
      </div>

      {/* Control Actions & Database Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: '0 0 14px' }}>
            Alarm Engine Operations
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 20px' }}>
            Trigger synchronizations between study session schedules and the notification daemon.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleSyncReminders}
              disabled={triggering}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
            >
              <Zap size={16} /> Sync All Sessions to Alarm Queue
            </button>

            <button
              onClick={handleTestAlarm}
              disabled={triggering}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
            >
              <Volume2 size={16} /> Schedule 1-Minute Immediate Test Alarm
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: '0 0 14px' }}>
            Database Integrity & Explorer
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Real-time SQLite database with WAL mode and foreign key constraints enabled.
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '16px',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}>
            <div><strong>Active Engine:</strong> SQLite 3 (WAL Mode)</div>
            <div style={{ marginTop: '4px' }}><strong>Status:</strong> Strict Role Authorization Enforced</div>
            <div style={{ marginTop: '4px' }}><strong>Admin Role Gate:</strong> @admin_required (HTTP 403)</div>
          </div>

          <Link
            to="/admin/database"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', textDecoration: 'none' }}
          >
            <Database size={16} /> Open Database Explorer
          </Link>
        </div>
      </div>
    </div>
  );
}
