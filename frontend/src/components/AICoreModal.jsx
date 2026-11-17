import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, HelpCircle, FileText, Award, Calendar, BarChart3, X } from 'lucide-react';

export default function AICoreModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const actions = [
    {
      title: 'Explain Topic',
      desc: 'Get standard, simplified, or step-by-step masterclasses',
      icon: Sparkles,
      color: '#6366f1',
      action: () => { onClose(); navigate('/ai-tutor'); }
    },
    {
      title: 'Solve Doubt',
      desc: 'Ask questions or upload textbook / homework photos',
      icon: HelpCircle,
      color: '#06b6d4',
      action: () => { onClose(); navigate('/doubt-solver'); }
    },
    {
      title: 'Generate Notes',
      desc: 'Instant high-yield summaries, formulas, and exam tips',
      icon: FileText,
      color: '#8b5cf6',
      action: () => { onClose(); navigate('/universe'); }
    },
    {
      title: 'Generate Quiz',
      desc: 'Test your understanding with AI multiple-choice questions',
      icon: Award,
      color: '#10b981',
      action: () => { onClose(); navigate('/quizzes'); }
    },
    {
      title: 'Plan My Day',
      desc: 'Deterministic schedule optimization and dynamic recovery',
      icon: Calendar,
      color: '#f59e0b',
      action: () => { onClose(); navigate('/planner'); }
    },
    {
      title: 'Analyze Progress',
      desc: 'Inspect knowledge gap radar and exam readiness %',
      icon: BarChart3,
      color: '#ec4899',
      action: () => { onClose(); navigate('/analytics'); }
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Planora AI Core</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Choose an AI capability to activate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {actions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={item.action}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  color: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
                  e.currentTarget.style.borderColor = 'var(--border-highlight)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: `${item.color}20`,
                  color: item.color,
                  display: 'flex'
                }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
