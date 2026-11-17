import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, User, Bot, BookOpen, Lightbulb, CheckSquare, MessageSquare } from 'lucide-react';
import { api } from '../services/api';

export default function AITutor() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your Planora AI Tutor. What subject or concept would you like to explore today? You can ask me to explain topics, simplify hard formulas, or test you with 'Teach Me Back'!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const res = await api.chatTutor({
        message: userText,
        conversation_id: conversationId
      });
      const data = res.data;
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error connecting to AI Tutor: ${err.message}. Please check API key in .env or try again.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    setInput(promptText);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} color="var(--primary)" /> AI Tutor
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Adaptive multi-turn explanations, Socratic dialogue, and active recall
          </p>
        </div>

        {/* Quick prompt buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => handleQuickPrompt("Explain Integration by parts with a step-by-step example")} className="btn btn-outline btn-sm">
            <BookOpen size={14} /> Explain Topic
          </button>
          <button onClick={() => handleQuickPrompt("Simplify Lenz's Law of Electromagnetic Induction so a beginner understands")} className="btn btn-outline btn-sm">
            <Lightbulb size={14} /> Simplify (ELI5)
          </button>
          <button onClick={() => handleQuickPrompt("Teach Me Back: Quiz me on the chain rule and evaluate my explanation")} className="btn btn-outline btn-sm">
            <CheckSquare size={14} /> Teach Me Back
          </button>
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="card" style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px'
      }}>
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {!isUser && (
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}>
                  <Bot size={18} />
                </div>
              )}

              <div style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-lg)',
                background: isUser ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                border: isUser ? 'none' : '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontSize: '0.94rem',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap'
              }}>
                {m.content}
              </div>

              {isUser && (
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}>
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            <Bot size={18} color="var(--primary)" />
            <span>AI Tutor is thinking and formatting educational response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          className="input"
          placeholder="Ask a question, formula clarification, or topic explanation..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ flex: 1, padding: '14px 18px' }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()} style={{ padding: '0 24px' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
