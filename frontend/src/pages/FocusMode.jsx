import React, { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  Square,
  Sparkles,
  CheckCircle,
  Volume2,
  VolumeX,
  AlertTriangle,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFocus } from '../context/FocusContext';

export default function FocusMode() {
  const { updateUser } = useAuth();
  const {
    isActive,
    targetMinutes,
    secondsRemaining,
    subjectId,
    subjectName,
    distractionCount,
    soundEnabled,
    sessionCompleted,
    earnedXp,
    startFocus,
    pauseFocus,
    resumeFocus,
    resetFocus,
    finishFocus,
    toggleSound
  } = useFocus();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState(subjectId || '');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await api.listSubjects();
      const subs = res?.data?.subjects || [];
      setSubjects(subs);
      if (subs.length > 0 && !selectedSubId) {
        setSelectedSubId(subs[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStart = () => {
    const subObj = subjects.find(s => s.id === parseInt(selectedSubId));
    startFocus({
      subjectId: selectedSubId ? parseInt(selectedSubId) : null,
      subjectName: subObj ? subObj.name : 'Focus Session',
      minutes: targetMinutes
    });
  };

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const progressPercent = Math.round(((targetMinutes * 60 - secondsRemaining) / (targetMinutes * 60)) * 100);

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Timer size={28} color="var(--primary)" /> Distraction-Free Focus Mode
        </h2>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Persistent study intervals that follow you across all Planora screens with Tab Sentinel distraction detection.
        </p>
      </div>

      {/* Target Subject Selector & Sound Toggle */}
      <div className="card" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Subject:</span>
          <select
            className="select"
            value={selectedSubId}
            onChange={(e) => setSelectedSubId(e.target.value)}
            disabled={isActive}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Interval preset buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Interval:</span>
          {[15, 25, 45, 60].map(m => (
            <button
              key={m}
              onClick={() => resetFocus(m)}
              disabled={isActive}
              className={`btn btn-sm ${targetMinutes === m ? 'btn-primary' : 'btn-secondary'}`}
            >
              {m}m
            </button>
          ))}

          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: '4px', padding: '6px 10px' }}
          >
            {soundEnabled ? <Volume2 size={16} color="#34d399" /> : <VolumeX size={16} color="#94a3b8" />}
          </button>
        </div>
      </div>

      {/* Main Clock Card */}
      <div className="card" style={{
        padding: '50px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, rgba(13, 20, 36, 0.95) 75%)',
        border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
        boxShadow: isActive ? '0 0 40px rgba(99, 102, 241, 0.2)' : 'none',
        position: 'relative'
      }}>
        {/* Tab Sentinel Badge */}
        {distractionCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '18px',
            right: '20px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertTriangle size={14} />
            <span>Tab Sentinel: {distractionCount} tab switch{distractionCount > 1 ? 'es' : ''} detected</span>
          </div>
        )}

        {/* Digital Clock Display */}
        <div style={{
          fontSize: '5.5rem',
          fontWeight: 900,
          fontFamily: 'var(--font-mono)',
          color: '#ffffff',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          textShadow: isActive ? '0 0 25px rgba(99, 102, 241, 0.5)' : 'none'
        }}>
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </div>

        <div style={{ fontSize: '0.92rem', color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: 600, marginTop: '14px' }}>
          {isActive ? '⚡ Deep Focus In Progress — Minimizes smoothly to persistent corner widget' : 'Ready to Start Study Interval'}
        </div>

        {/* Progress Bar */}
        <div style={{ width: '80%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', margin: '28px 0 32px' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-cyan) 100%)', borderRadius: '4px', transition: 'width 1s linear' }} />
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {!isActive && secondsRemaining === targetMinutes * 60 ? (
            <button onClick={handleStart} className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '1rem' }}>
              <Play size={20} /> Begin Focus Session
            </button>
          ) : !isActive ? (
            <button onClick={resumeFocus} className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '1rem' }}>
              <Play size={20} /> Resume Timer
            </button>
          ) : (
            <button onClick={pauseFocus} className="btn btn-secondary" style={{ padding: '14px 36px', fontSize: '1rem' }}>
              <Pause size={20} /> Pause Timer
            </button>
          )}

          <button onClick={() => resetFocus()} className="btn btn-secondary" style={{ padding: '14px 22px' }} title="Reset Timer">
            <RotateCcw size={18} /> Reset
          </button>

          <button onClick={finishFocus} className="btn btn-outline" style={{ padding: '14px 24px' }}>
            <Square size={18} /> Finish & Record
          </button>
        </div>
      </div>

      {/* Completion Banner */}
      {sessionCompleted && (
        <div style={{
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <CheckCircle size={24} color="var(--success)" />
          <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>
            Session recorded successfully! You earned +{earnedXp} XP and updated your study streak.
          </div>
        </div>
      )}

      {/* Tab Sentinel & Distraction Blocker Guide */}
      <div className="card" style={{ padding: '24px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <ShieldAlert size={20} color="#818cf8" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Tab Sentinel & Social Distraction Protocol
          </h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
          Planora actively tracks window blur events during your focus intervals. To block social media feeds (Instagram, Twitter/X, TikTok, Reddit, Facebook) while keeping study aids (YouTube educational playlists, WhatsApp study groups, and Planora) unblocked:
        </p>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '10px',
          padding: '14px 18px',
          fontSize: '0.82rem',
          color: '#cbd5e1'
        }}>
          <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>Recommended Rules for Windows:</div>
          <div>1. <strong>Allowed Study Domains:</strong> `localhost`, `planora.ai`, `web.whatsapp.com`, `youtube.com`</div>
          <div style={{ marginTop: '4px' }}>2. <strong>Focus Blocker Extensions:</strong> Install Chrome extension <em>StayFocusd</em> or <em>BlockSite</em> with Planora in the Allowlist.</div>
          <div style={{ marginTop: '4px' }}>3. <strong>Automatic Streak Guard:</strong> Sessions completed with 0 tab switches earn bonus XP!</div>
        </div>
      </div>
    </div>
  );
}
