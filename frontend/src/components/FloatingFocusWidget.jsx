import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Timer,
  Play,
  Pause,
  Maximize2,
  Square,
  AlertTriangle,
  X,
  Sparkles
} from 'lucide-react';
import { useFocus } from '../context/FocusContext';

export default function FloatingFocusWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isActive,
    targetMinutes,
    secondsRemaining,
    subjectName,
    distractionCount,
    distractionAlert,
    dismissDistractionAlert,
    pauseFocus,
    resumeFocus,
    finishFocus
  } = useFocus();

  // If user is currently on the full Focus page, don't duplicate the floating card
  const isFocusPage = location.pathname === '/focus';

  // Show floating widget if timer is active or has remaining time < target time (i.e. paused in middle of session)
  const isSessionInProgress = isActive || (secondsRemaining < targetMinutes * 60 && secondsRemaining > 0);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <>
      {/* Tab Sentinel Distraction Warning Banner */}
      {distractionAlert && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 10000,
          background: 'rgba(239, 68, 68, 0.95)',
          backdropFilter: 'blur(10px)',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideInRight 0.3s ease'
        }}>
          <AlertTriangle size={20} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Focus Interruption Detected!</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
              You switched tabs {distractionCount} time{distractionCount > 1 ? 's' : ''}. Stay on track!
            </div>
          </div>
          <button
            onClick={dismissDistractionAlert}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Floating Persistent Mini-Timer Widget */}
      {!isFocusPage && isSessionInProgress && (
        <div
          className="floating-focus-bar"
          style={{
            position: 'fixed',
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: isActive ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '16px',
            padding: '12px 16px',
            boxShadow: isActive ? '0 8px 32px rgba(99, 102, 241, 0.3)' : '0 8px 25px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#ffffff',
            transition: 'all 0.2s ease'
          }}
        >
          <style>{`
            .floating-focus-bar {
              bottom: 96px;
              right: 28px;
            }
            @media (max-width: 900px) {
              .floating-focus-bar {
                bottom: calc(135px + env(safe-area-inset-bottom, 0px));
                right: 16px;
                max-width: calc(100vw - 32px);
              }
            }
          `}</style>
          {/* Pulsing indicator */}
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: isActive ? '#10b981' : '#f59e0b',
            boxShadow: isActive ? '0 0 10px #10b981' : 'none',
            animation: isActive ? 'pulse 2s infinite' : 'none'
          }} />

          {/* Time & Subject */}
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1 }}>
              {timeFormatted}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
              {subjectName || 'Focus Mode'}
              {distractionCount > 0 && (
                <span style={{ color: '#f87171', marginLeft: '6px', fontWeight: 600 }}>
                  ({distractionCount} tabs)
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isActive ? (
              <button
                onClick={pauseFocus}
                title="Pause Focus"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Pause size={16} />
              </button>
            ) : (
              <button
                onClick={resumeFocus}
                title="Resume Focus"
                style={{
                  background: 'var(--primary)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Play size={16} />
              </button>
            )}

            <button
              onClick={finishFocus}
              title="Finish Session Early"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Square size={14} />
            </button>

            <button
              onClick={() => navigate('/focus')}
              title="Expand to Fullscreen Focus"
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#818cf8',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
