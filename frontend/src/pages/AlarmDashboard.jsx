import React, { useState, useEffect } from 'react';
import { Bell, Clock, Volume2, VolumeX, CheckCircle, AlertTriangle, Play, RefreshCw, Plus, Calendar, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function AlarmDashboard() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationPerm, setNotificationPerm] = useState('default');
  const [testStatus, setTestStatus] = useState('');
  const [syncStatus, setSyncStatus] = useState('');

  // New alarm modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [minutesBefore, setMinutesBefore] = useState(10);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    loadReminders();
    if ('Notification' in window) {
      setNotificationPerm(Notification.permission);
    }
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const res = await api.listReminders();
      setReminders(res.data?.reminders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPerm(perm);
    }
  };

  const handleTestAlarm = async () => {
    setTestStatus('Dispatching test alarm...');
    try {
      await api.testAlarm();
      setTestStatus('Alarm dispatched! It will chime in 3 seconds.');
      setTimeout(() => {
        setTestStatus('');
        loadReminders();
      }, 4000);
    } catch (err) {
      setTestStatus('Test alarm failed');
    }
  };

  const handleSyncSessions = async () => {
    setSyncStatus('Scanning planner sessions...');
    try {
      const res = await api.syncSessionReminders();
      const count = res.data?.created_alarms_count || 0;
      setSyncStatus(`Created ${count} new session alarms!`);
      loadReminders();
      setTimeout(() => setSyncStatus(''), 4000);
    } catch (err) {
      setSyncStatus('Session sync failed');
    }
  };

  const handleDismiss = async (id) => {
    try {
      await api.dismissReminder(id);
      loadReminders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSnooze = async (id) => {
    try {
      await api.snoozeReminder(id, 5);
      loadReminders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.createReminder({
        title,
        subject_name: subjectName,
        minutes_before: minutesBefore,
        sound_enabled: soundEnabled
      });
      setShowNewModal(false);
      setTitle('');
      setSubjectName('');
      loadReminders();
    } catch (err) {
      alert(err.message || 'Failed to create alarm');
    }
  };

  const pendingAlarms = reminders.filter(r => r.status === 'pending');
  const pastAlarms = reminders.filter(r => r.status !== 'pending');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={13} /> Smart Alarm System
            </span>
            <span className={`badge ${notificationPerm === 'granted' ? 'badge-success' : 'badge-warning'}`}>
              Browser Notifications: {notificationPerm}
            </span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Study Alarms & Session Reminders
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Automated audio chimes, browser alerts, and countdowns for your scheduled study blocks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {notificationPerm !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}
            >
              <Bell size={14} /> Enable Browser Alerts
            </button>
          )}

          <button
            onClick={handleSyncSessions}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Calendar size={14} /> Sync Planner Sessions
          </button>

          <button
            onClick={handleTestAlarm}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Play size={14} /> Test Alarm Now
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Custom Alarm
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {testStatus && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1', color: '#a5b4fc', fontSize: '0.88rem' }}>
          🔔 {testStatus}
        </div>
      )}
      {syncStatus && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', fontSize: '0.88rem' }}>
          ✓ {syncStatus}
        </div>
      )}

      {/* Active Upcoming Alarms */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Active Scheduled Alarms ({pendingAlarms.length})
            </h2>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              These alarms will automatically chime and trigger browser notifications at the exact scheduled time.
            </div>
          </div>
          <button onClick={loadReminders} className="btn btn-secondary btn-sm">
            <RefreshCw size={13} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading active alarms...</div>
        ) : pendingAlarms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
            <Bell size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>No Active Alarms Scheduled</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 18px' }}>
              Click "Sync Planner Sessions" to automatically schedule alarms 10 minutes before all your upcoming sessions, or click "Test Alarm Now" to hear the audio chime.
            </p>
            <button onClick={handleSyncSessions} className="btn btn-primary btn-sm">
              Sync Planner Sessions
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {pendingAlarms.map(a => (
              <div
                key={a.id}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                      <Bell size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.96rem' }}>{a.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.subject_name || 'General'} {a.topic_name ? `• ${a.topic_name}` : ''}</div>
                    </div>
                  </div>
                  <span className="badge badge-primary">{a.minutes_before}m before</span>
                </div>

                <div style={{ padding: '8px 12px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '6px', fontSize: '0.82rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div><strong>Alarm Fires At:</strong> <span style={{ color: '#38bdf8' }}>{new Date(a.remind_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(a.remind_at).toLocaleDateString()})</span></div>
                  <div><strong>Session Start:</strong> {new Date(a.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button onClick={() => handleSnooze(a.id)} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.8rem' }}>
                    Snooze 5m
                  </button>
                  <button onClick={() => handleDismiss(a.id)} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.8rem', color: '#ef4444' }}>
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivered / Historical Alarms */}
      {pastAlarms.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
            Recently Delivered / Dismissed Alarms ({pastAlarms.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pastAlarms.slice(0, 6).map(a => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={15} color="var(--success)" />
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{a.title}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({a.subject_name || 'Session'})</span>
                </div>
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Custom Alarm Modal */}
      {showNewModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 16px' }}>
              Create Custom Study Alarm
            </h3>
            <form onSubmit={handleCreateCustom} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Alarm Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Formula Recall Session"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics / Organic Chemistry"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Remind Me</label>
                <select
                  value={minutesBefore}
                  onChange={(e) => setMinutesBefore(parseInt(e.target.value))}
                  className="input-field"
                >
                  <option value={0}>At session start time</option>
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="soundToggle"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
                <label htmlFor="soundToggle" style={{ fontSize: '0.88rem', color: '#ffffff', cursor: 'pointer' }}>
                  Enable audio chime when alarm triggers
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowNewModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Create Alarm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
