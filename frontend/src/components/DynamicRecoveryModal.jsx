import React from 'react';
import { AlertTriangle, Clock, Calendar, ArrowRight, X } from 'lucide-react';

export default function DynamicRecoveryModal({ session, onRecover, onClose }) {
  if (!session) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--warning)'
          }}>
            <AlertTriangle size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Adaptive Dynamic Recovery
            </span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
              Missed Study Session Detected
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
          You missed scheduled session <strong style={{ color: '#ffffff' }}>"{session.title}"</strong> ({session.duration_minutes} mins).
          Planora can adapt your schedule automatically so you never fall behind on exam readiness.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => onRecover(session.id, 'study_now')}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'flex-start', padding: '14px 18px' }}
          >
            <Clock size={18} />
            <div style={{ textAlign: 'left', marginLeft: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Study Right Now</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Start session timer and begin immediately</div>
            </div>
          </button>

          <button
            onClick={() => onRecover(session.id, 'reschedule')}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start', padding: '14px 18px' }}
          >
            <Calendar size={18} />
            <div style={{ textAlign: 'left', marginLeft: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Reschedule for Tomorrow</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shifts session into tomorrow's available study slot</div>
            </div>
          </button>

          <button
            onClick={() => onRecover(session.id, 'skip')}
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
          >
            Skip this session
          </button>
        </div>
      </div>
    </div>
  );
}
