import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Lock, AlertTriangle, ArrowRight, Sparkles, Compass } from 'lucide-react';
import { api } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function KnowledgeUniverse() {
  const navigate = useNavigate();
  const [universeData, setUniverseData] = useState({ nodes: [], links: [] });
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');

  useEffect(() => {
    loadUniverse();
  }, []);

  const loadUniverse = async () => {
    try {
      const [uniRes, pathRes] = await Promise.all([
        api.getKnowledgeUniverse(),
        api.getLearningPath()
      ]);
      setUniverseData(uniRes?.data || { nodes: [], links: [] });
      setLearningPath(pathRes?.data?.recommendation || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} height="80px" />;
  }

  const topicNodes = universeData.nodes.filter(n => n.type === 'topic');
  const subjectNodes = universeData.nodes.filter(n => n.type === 'subject');

  const filteredTopics = selectedSubjectFilter === 'all'
    ? topicNodes
    : topicNodes.filter(t => t.subject_id === parseInt(selectedSubjectFilter));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success"><CheckCircle size={12} /> Mastered</span>;
      case 'learning':
        return <span className="badge badge-primary"><Compass size={12} /> Active</span>;
      case 'weak':
        return <span className="badge badge-danger"><AlertTriangle size={12} /> High Gap</span>;
      case 'locked':
        return <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}><Lock size={12} /> Prereq Locked</span>;
      default:
        return <span className="badge badge-cyan">Upcoming</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={24} color="var(--primary)" /> Knowledge Universe
        </h2>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Visual topic map connected to live MySQL mastery telemetry and prerequisite dependencies.
        </p>
      </div>

      {/* Recommended Learning Path Banner */}
      {learningPath && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
          border: '1px solid var(--border-highlight)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                Adaptive Learning Path Recommendation
              </span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                Study Next: {learningPath.topic_name} ({learningPath.subject_name})
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {learningPath.reason}
              </p>
            </div>
          </div>

          <Link to={`/study-hub/${learningPath.topic_id}`} className="btn btn-primary">
            Open Study Hub <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Filter and Legend */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Subject Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Filter Subject:</span>
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className={`btn btn-sm ${selectedSubjectFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Subjects
          </button>
          {subjectNodes.map(s => {
            const sId = s.id.replace('sub_', '');
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectFilter(sId)}
                className={`btn btn-sm ${selectedSubjectFilter === sId ? 'btn-primary' : 'btn-secondary'}`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Status Legend */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--success)' }}>● Mastered</span>
          <span style={{ color: 'var(--primary)' }}>● Active</span>
          <span style={{ color: 'var(--danger)' }}>● Knowledge Gap</span>
          <span style={{ color: 'var(--text-muted)' }}>● Locked</span>
        </div>
      </div>

      {/* Topic Map Node Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
        {filteredTopics.map((t) => {
          const rawId = parseInt(t.id.replace('topic_', ''));
          const isLocked = t.status === 'locked';

          return (
            <div
              key={t.id}
              className="card"
              style={{
                padding: '20px',
                borderLeft: `4px solid ${t.color || 'var(--primary)'}`,
                opacity: isLocked ? 0.65 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onClick={() => {
                if (!isLocked) navigate(`/study-hub/${rawId}`);
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge" style={{ background: `${t.color || '#6366f1'}20`, color: t.color || '#818cf8' }}>
                    {t.subject_name}
                  </span>
                  {getStatusBadge(t.status)}
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: '6px 0 4px' }}>
                  {t.label}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Chapter: {t.chapter || 'Foundations'} • Difficulty: {t.difficulty}
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Confidence: {'★'.repeat(t.confidence || 1)}{'☆'.repeat(5 - (t.confidence || 1))}
                </span>

                {!isLocked ? (
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Study Hub <ArrowRight size={14} />
                  </span>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Complete Prereq
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
