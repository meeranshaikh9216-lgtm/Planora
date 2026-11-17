import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Flame,
  Zap,
  Bell,
  Sun,
  Moon,
  CheckCheck,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  Calendar,
  BookOpen,
  FlaskConical,
  CalendarCheck,
  BarChart3,
  Repeat,
  Timer,
  User,
  HelpCircle,
  Layers,
  FileText,
  Settings,
  Database,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.listNotifications();
      setNotifications(res?.data?.notifications || []);
      setUnreadCount(res?.data?.unread_count || 0);
    } catch (e) {
      console.warn("Failed fetching notifications:", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const mobileLinks = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/planner', label: 'Planner', icon: Calendar },
    { to: '/universe', label: 'Learn & Universe', icon: BookOpen },
    { to: '/practicals', label: 'Practical Lab', icon: FlaskConical, badge: 'NEW' },
    { to: '/assignments', label: 'Assignments', icon: CalendarCheck },
    { to: '/ai-tutor', label: 'AI Tutor', icon: Sparkles, badge: 'AI' },
    { to: '/analytics', label: 'Progress Analytics', icon: BarChart3 },
    { to: '/revisions', label: 'Smart Revision', icon: Repeat },
    { to: '/focus', label: 'Focus Mode', icon: Timer },
    { to: '/doubt-solver', label: 'Doubt Solver', icon: HelpCircle },
    { to: '/mistakes', label: 'Mistake Bank', icon: Layers },
    { to: '/pdf-teacher', label: 'PDF Teacher', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Console', icon: Database, badge: 'ADMIN' }] : [])
  ];

  return (
    <>
      <header
        className="app-navbar"
        style={{
          height: '70px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(7, 11, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <style>{`
          .mobile-menu-btn {
            display: none !important;
          }
          @media (max-width: 900px) {
            .app-navbar {
              padding: 0 16px !important;
            }
            .mobile-menu-btn {
              display: flex !important;
            }
            .welcome-full {
              display: none !important;
            }
            .pill-label {
              display: none !important;
            }
          }
          @media (max-width: 600px) {
            .hide-on-mobile-xs {
              display: none !important;
            }
          }
        `}</style>

        {/* Left side: Hamburger on mobile + Welcome info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setDrawerOpen(true)}
            className="mobile-menu-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              width: '38px',
              height: '38px',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff'
            }}
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} className="welcome-full">Welcome back,</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
              {user?.name ? user.name.split(' ')[0] : 'Scholar'} 👋
            </div>
          </div>
        </div>

        {/* Action items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Streak Counter */}
          <div
            title={`${user?.streak || 0} Day Streak`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '6px 10px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#fbbf24'
            }}
          >
            <Flame size={15} fill="#fbbf24" />
            <span>{user?.streak || 0}</span>
            <span className="pill-label">Day Streak</span>
          </div>

          {/* XP Counter */}
          <div
            className="hide-on-mobile-xs"
            title={`${user?.xp || 0} XP`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '6px 10px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#a5b4fc'
            }}
          >
            <Zap size={15} fill="#818cf8" />
            <span>{user?.xp || 0}</span>
            <span className="pill-label">XP</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="hide-on-mobile-xs"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)'
            }}
            title="Toggle Light/Dark Theme"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications Dropdown */}
          <div style={{ position: 'relative' }} className="hide-on-mobile-xs">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-main)',
                position: 'relative'
              }}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: 'var(--danger)',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  width: 'min(340px, calc(100vw - 32px))',
                  background: '#0d1424',
                  border: '1px solid var(--border-highlight)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-md)',
                  padding: '16px',
                  zIndex: 100
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        style={{
                          padding: '10px 12px',
                          background: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>{n.title}</div>
                        <div style={{ color: 'var(--text-muted)', lineHeight: 1.3 }}>{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <Link
            to="/profile"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.9rem',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)'
            }}
            title="My Profile"
            aria-label="View Profile"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Link>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer for full navigation */}
      {drawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex'
          }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            style={{
              width: 'min(300px, 82vw)',
              height: '100%',
              background: '#0a0e1a',
              borderRight: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px))',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={20} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>PLANORA</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>AI Study Coach</div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Links List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {mobileLinks.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: isActive ? '#a5b4fc' : '#94a3b8',
                      border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                    })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: item.badge === 'ADMIN' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                        color: item.badge === 'ADMIN' ? '#f87171' : '#818cf8',
                        border: item.badge === 'ADMIN' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* User Footer & Logout */}
            <div style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>
                  {user?.name || 'Student'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {user?.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '8px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
