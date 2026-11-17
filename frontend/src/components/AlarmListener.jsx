import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, X, Volume2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

/**
 * Web Audio API synthesizer for a pleasant, high-audibility study alarm chime.
 * Works natively in all modern browsers without requiring external audio assets.
 */
function playAlarmChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + index * 0.18;
      const duration = 0.45;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (err) {
    console.warn('Audio chime playback error:', err);
  }
}

export default function AlarmListener() {
  const [activeAlarm, setActiveAlarm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for due alarms immediately on mount and every 25 seconds
    checkDueAlarms();
    const interval = setInterval(checkDueAlarms, 25000);
    return () => clearInterval(interval);
  }, []);

  const checkDueAlarms = async () => {
    try {
      const res = await api.getDueReminders();
      const dueList = res.data?.due_reminders || [];
      if (dueList.length > 0 && !activeAlarm) {
        const current = dueList[0];
        setActiveAlarm(current);

        // 1. Play audio alarm chime
        if (current.sound_enabled !== false) {
          playAlarmChime();
        }

        // 2. Trigger native browser notification if granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Planora Study Alarm: ${current.title}`, {
            body: `${current.subject_name || 'Study Session'} • ${current.topic_name || ''}\nStarting soon!`,
            icon: '/favicon.ico'
          });
        }
      }
    } catch (err) {
      // Silently handle offline/polling issues
    }
  };

  const handleDismiss = async () => {
    if (!activeAlarm) return;
    try {
      await api.dismissReminder(activeAlarm.id);
    } catch (err) {
      console.error(err);
    }
    setActiveAlarm(null);
  };

  const handleSnooze = async () => {
    if (!activeAlarm) return;
    try {
      await api.snoozeReminder(activeAlarm.id, 5);
    } catch (err) {
      console.error(err);
    }
    setActiveAlarm(null);
  };

  const handleOpenStudy = () => {
    const session = activeAlarm;
    handleDismiss();
    navigate('/planner');
  };

  if (!activeAlarm) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      maxWidth: '420px',
      width: 'calc(100% - 48px)',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
      border: '2px solid #6366f1',
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.4)',
      padding: '20px',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8'
          }}>
            <Bell size={20} className="animate-pulse" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc', fontWeight: 700 }}>
              Planora Study Alarm
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
              {activeAlarm.title}
            </div>
          </div>
        </div>
        <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{
        padding: '10px 14px',
        background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: '8px',
        fontSize: '0.86rem',
        color: '#cbd5e1',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {activeAlarm.subject_name && (
          <div><strong>Subject:</strong> {activeAlarm.subject_name} {activeAlarm.topic_name ? `• ${activeAlarm.topic_name}` : ''}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
          <Clock size={14} /> Scheduled Start: {activeAlarm.scheduled_start ? new Date(activeAlarm.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Soon'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleOpenStudy}
          className="btn btn-primary btn-sm"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          Open Session <ArrowRight size={14} />
        </button>
        <button
          onClick={handleSnooze}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.82rem' }}
        >
          Snooze 5m
        </button>
        <button
          onClick={handleDismiss}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.82rem' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
