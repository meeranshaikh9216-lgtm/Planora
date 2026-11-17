import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, GraduationCap, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [roleMode, setRoleMode] = useState('student'); // 'student' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = (mode) => {
    setRoleMode(mode);
    setError('');
    if (mode === 'admin') {
      setEmail('');
      setPassword('');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (roleMode === 'admin') {
        const res = await adminLogin(email, password);
        const user = res.data.user;
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          setError('Access denied: Administrator privileges required.');
        }
      } else {
        const res = await login(email, password);
        const user = res.data.user;
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.profile && user.profile.onboarding_completed) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    if (roleMode === 'admin') {
      setEmail('admin@planora.ai');
      setPassword('Admin@123456');
    } else {
      setEmail('demo@planora.ai');
      setPassword('password123');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d16 100%)'
    }}>
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '36px 32px' }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: roleMode === 'admin' 
              ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: roleMode === 'admin' 
              ? '0 4px 20px rgba(239, 68, 68, 0.4)'
              : '0 4px 20px rgba(99, 102, 241, 0.4)',
            marginBottom: '12px',
            transition: 'all 0.3s ease'
          }}>
            {roleMode === 'admin' ? <ShieldCheck size={28} color="#ffffff" /> : <Sparkles size={28} color="#ffffff" />}
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
            Planora Portal
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {roleMode === 'admin' 
              ? 'Institutional Admin Console & System Monitoring' 
              : 'AI-Powered Study Planner & Universal Learning Assistant'}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '6px',
          borderRadius: '14px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => handleRoleSwitch('student')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              transition: 'all 0.2s',
              background: roleMode === 'student' ? 'var(--primary)' : 'transparent',
              color: roleMode === 'student' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <GraduationCap size={18} />
            Student Login
          </button>

          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              transition: 'all 0.2s',
              background: roleMode === 'admin' ? '#ef4444' : 'transparent',
              color: roleMode === 'admin' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <ShieldCheck size={18} />
            Admin Console
          </button>
        </div>

        {/* Role Description Notice */}
        {roleMode === 'admin' ? (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '20px',
            fontSize: '0.82rem',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <span>Authorized staff only: inspect student records, AI plans, and database explorer.</span>
          </div>
        ) : (
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '20px',
            fontSize: '0.82rem',
            color: '#a5b4fc',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <UserCheck size={18} style={{ flexShrink: 0 }} />
            <span>Access your personalized study schedule, practicals, focus mode, and learning tools.</span>
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '20px',
            color: '#f87171',
            fontSize: '0.88rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label className="label">{roleMode === 'admin' ? 'Admin Username / Email' : 'Student Email Address'}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input"
                placeholder={roleMode === 'admin' ? 'admin@planora.ai' : 'student@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn"
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '6px',
              background: roleMode === 'admin' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'var(--primary)',
              color: '#ffffff',
              fontWeight: 700,
              border: 'none',
              boxShadow: roleMode === 'admin' ? '0 4px 15px rgba(239, 68, 68, 0.35)' : 'var(--glow-primary)'
            }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (roleMode === 'admin' ? 'Open Admin Console' : 'Sign In as Student')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleDemoFill}
            style={{
              background: 'none',
              border: 'none',
              color: roleMode === 'admin' ? '#f87171' : 'var(--accent-cyan)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {roleMode === 'admin'
              ? 'Click to auto-fill Admin credentials (admin@planora.ai)'
              : 'Click to auto-fill Demo Student credentials (demo@planora.ai)'}
          </button>
        </div>

        {roleMode === 'student' && (
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            New student?{' '}
            <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create an account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
