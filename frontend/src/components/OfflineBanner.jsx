import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // Fast ping check with cache bust
      await fetch('/favicon.svg?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOffline) return null;

  return (
    <aside
      aria-label="Offline status"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.4)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
        paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))',
        paddingBottom: '8px',
        paddingLeft: '16px',
        paddingRight: '16px',
        color: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '0.82rem',
        animation: 'slideDown 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <WifiOff size={16} color="#fbbf24" />
        </div>
        <div>
          <span style={{ fontWeight: 700, color: '#fbbf24' }}>Offline Mode Active: </span>
          <span style={{ color: '#cbd5e1' }}>
            Interface is cached, but AI Tutor, Quiz evaluations, and Cloud Sync require an internet connection.
          </span>
        </div>
      </div>
      <button
        onClick={checkConnection}
        disabled={isChecking}
        style={{
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#fbbf24',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0
        }}
      >
        <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
        <span>{isChecking ? 'Checking...' : 'Retry'}</span>
      </button>
    </aside>
  );
}
