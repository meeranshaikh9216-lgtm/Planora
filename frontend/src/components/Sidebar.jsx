import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Sparkles,
  BarChart3,
  Repeat,
  Timer,
  User,
  HelpCircle,
  FileText,
  Layers,
  Settings,
  FlaskConical,
  Bell,
  CalendarCheck,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/planner', label: 'Planner', icon: Calendar },
    { to: '/universe', label: 'Learn', icon: BookOpen },
    { to: '/practicals', label: 'Practical Lab', icon: FlaskConical, badge: 'NEW' },
    { to: '/assignments', label: 'Assignments', icon: CalendarCheck },
    { to: '/ai-tutor', label: 'AI Tutor', icon: Sparkles, badge: 'AI' },
    { to: '/analytics', label: 'Progress', icon: BarChart3 },
    { to: '/revisions', label: 'Revision', icon: Repeat },
    { to: '/focus', label: 'Focus', icon: Timer },
    { to: '/profile', label: 'Profile', icon: User }
  ];

  const subItems = [
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Console', icon: Database, badge: 'ADMIN' }] : []),
    { to: '/doubt-solver', label: 'Doubt Solver', icon: HelpCircle },
    { to: '/mistakes', label: 'Mistake Bank', icon: Layers },
    { to: '/pdf-teacher', label: 'PDF Teacher', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="desktop-sidebar" style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'rgba(9, 14, 26, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      padding: '24px 16px'
    }}>
      <style>{`
        @media (max-width: 900px) {
          .desktop-sidebar {
            display: none !important;
          }
        }
      `}</style>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', marginBottom: '32px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
        }}>
          <Sparkles size={22} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', margin: 0, lineHeight: 1.1 }}>
            PLANORA
          </h1>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Your AI Study Coach</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 10px' }}>
          Navigation
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  background: isActive ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.22) 0%, rgba(99, 102, 241, 0.05) 100%)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all 0.2s ease'
                })}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: 'rgba(6, 182, 212, 0.2)',
                    color: 'var(--accent-cyan)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '24px 8px 10px' }}>
          Study Tools
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {subItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  transition: 'all 0.2s ease'
                })}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Mini Profile in Sidebar Bottom */}
      <div style={{
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          color: '#ffffff',
          fontSize: '0.85rem'
        }}>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name || 'Student'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            ⚡ {user?.xp || 0} XP
          </div>
        </div>
      </div>
    </aside>
  );
}
