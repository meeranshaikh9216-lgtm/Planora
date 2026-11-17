import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Sparkles, BookOpen, User } from 'lucide-react';

export default function MobileNav() {
  const items = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/planner', label: 'Plan', icon: Calendar },
    { to: '/ai-tutor', label: 'AI Tutor', icon: Sparkles, isAi: true },
    { to: '/universe', label: 'Learn', icon: BookOpen },
    { to: '/profile', label: 'Profile', icon: User }
  ];

  return (
    <nav
      className="mobile-nav"
      aria-label="Mobile Navigation"
      style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(65px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(7, 11, 20, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
        zIndex: 90,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingLeft: '12px',
        paddingRight: '12px'
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .mobile-nav {
            display: flex !important;
          }
        }
      `}</style>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              textDecoration: 'none',
              fontSize: '0.72rem',
              fontWeight: 600,
              minWidth: '52px',
              minHeight: '44px',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'color 0.2s ease',
              padding: '4px 6px',
              borderRadius: '8px'
            })}
          >
            {item.isAi ? (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-cyan) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '-16px',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.55)',
                  border: '2px solid #070b14'
                }}
              >
                <Icon size={18} color="#ffffff" />
              </div>
            ) : (
              <Icon size={20} />
            )}
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
