import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import AICoreModal from './AICoreModal';

export default function FloatingAiButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <style>{`
        .floating-ai-trigger {
          position: fixed;
          bottom: 28px;
          right: 28px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
          border: 2px solid rgba(255, 255, 255, 0.4);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5);
          z-index: 85;
          transition: transform 0.2s ease, bottom 0.2s ease;
        }
        .floating-ai-trigger:hover {
          transform: scale(1.08);
        }
        @media (max-width: 900px) {
          .floating-ai-trigger {
            bottom: calc(75px + env(safe-area-inset-bottom, 0px));
            right: 16px;
            width: 48px;
            height: 48px;
          }
        }
      `}</style>
      <button
        onClick={() => setModalOpen(true)}
        className="animate-pulse-glow floating-ai-trigger"
        title="Ask Planora AI Coach"
        aria-label="Open AI Tutor"
      >
        <Sparkles size={24} />
      </button>

      <AICoreModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
