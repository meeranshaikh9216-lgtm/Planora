import React, { useState, useEffect } from 'react';
import { Layers, Sparkles, Plus, CheckCircle, RotateCw, Trash2, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function Flashcards() {
  const [flashcards, setFlashcards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flippedId, setFlippedId] = useState(null);
  const [filterMastery, setFilterMastery] = useState('all');

  // Generator State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genSubjectId, setGenSubjectId] = useState('');
  const [genTopicId, setGenTopicId] = useState('');
  const [genTopics, setGenTopics] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterMastery]);

  const loadData = async () => {
    setLoading(true);
    try {
      let params = '';
      if (filterMastery !== 'all') params = `mastery_level=${filterMastery}`;
      const [fcRes, subRes] = await Promise.all([
        api.listFlashcards(params),
        api.listSubjects()
      ]);
      setFlashcards(fcRes?.data?.flashcards || []);
      const subs = subRes?.data?.subjects || [];
      setSubjects(subs);
      if (subs.length > 0 && !genSubjectId) {
        setGenSubjectId(subs[0].id);
        fetchTopicsForSubject(subs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicsForSubject = async (subId) => {
    try {
      const res = await api.listTopics(subId);
      const topList = res?.data?.topics || [];
      setGenTopics(topList);
      if (topList.length > 0) setGenTopicId(topList[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubjectChange = (subId) => {
    setGenSubjectId(subId);
    fetchTopicsForSubject(subId);
  };

  const handleMasteryReview = async (id, mastery) => {
    try {
      await api.reviewFlashcard(id, mastery);
      setFlashcards(flashcards.map(c => c.id === id ? { ...c, mastery_level: mastery } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteFlashcard(id);
      setFlashcards(flashcards.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!genTopicId) return;
    setGenerating(true);
    try {
      await api.generateFlashcards({
        subject_id: genSubjectId,
        topic_id: genTopicId,
        count: 5
      });
      setShowGenModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={24} color="var(--accent-cyan)" /> Active Recall Flashcards
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            3D interactive flip cards with mastery categorization and spaced repetition feedback.
          </p>
        </div>

        <button onClick={() => setShowGenModal(true)} className="btn btn-primary">
          <Sparkles size={18} /> Generate AI Flashcards
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['all', 'new', 'known', 'need_revision'].map(f => (
          <button
            key={f}
            onClick={() => setFilterMastery(f)}
            className={`btn btn-sm ${filterMastery === f ? 'btn-primary' : 'btn-secondary'}`}
          >
            {f === 'all' ? 'All Cards' : f === 'known' ? 'Mastered' : f === 'need_revision' ? 'Needs Revision' : 'New'}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="200px" />
      ) : flashcards.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Layers size={40} color="var(--primary)" style={{ marginBottom: '14px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            No flashcards in this filter
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
            Generate flashcard sets from topics to kick off active recall sessions.
          </p>
          <button onClick={() => setShowGenModal(true)} className="btn btn-primary">
            <Sparkles size={16} /> Auto-Generate Set
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
          {flashcards.map(c => {
            const isFlipped = flippedId === c.id;
            return (
              <div
                key={c.id}
                className={`flip-card ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setFlippedId(isFlipped ? null : c.id)}
              >
                <div className="flip-card-inner">
                  {/* Front Side */}
                  <div className="flip-card-front">
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                      <span className="badge badge-primary">{c.subject_name || 'Subject'}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click to flip</span>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.45, margin: 0 }}>
                        {c.front_text}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '12px' }}>
                      <span className="badge badge-warning">{c.difficulty}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Status: {c.mastery_level}
                      </span>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="flip-card-back">
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
                      <span className="badge badge-cyan">Answer</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                        title="Delete card"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ fontSize: '1rem', color: '#ffffff', lineHeight: 1.5, margin: 0 }}>
                        {c.back_text}
                      </p>
                    </div>

                    {/* Mastery rating buttons */}
                    <div
                      style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center', marginTop: '12px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleMasteryReview(c.id, 'known')}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--success)' }}
                      >
                        <Check size={14} /> Know It
                      </button>
                      <button
                        onClick={() => handleMasteryReview(c.id, 'need_revision')}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--warning)' }}
                      >
                        <RotateCw size={14} /> Needs Work
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generate Flashcards Modal */}
      {showGenModal && (
        <div className="modal-overlay" onClick={() => setShowGenModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
              Generate AI Flashcards
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Synthesizes prompt-answer pairs designed for optimal active recall.
            </p>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Subject</label>
                <select className="select" value={genSubjectId} onChange={(e) => handleSubjectChange(e.target.value)} required>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Topic</label>
                <select className="select" value={genTopicId} onChange={(e) => setGenTopicId(e.target.value)} required>
                  {genTopics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowGenModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={generating || !genTopicId}>
                  {generating ? 'Generating Cards...' : 'Generate 5 Flashcards'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
