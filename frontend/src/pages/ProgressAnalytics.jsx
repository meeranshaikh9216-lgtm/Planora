import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { BarChart3, Clock, CheckCircle, Award, Flame, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ProgressAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await api.getAnalytics();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} height="120px" />;
  }

  const {
    weekly_study = { labels: [], data: [] },
    subject_progress = [],
    quiz_timeline = [],
    readiness = {},
    knowledge_gaps = []
  } = data || {};

  // Weekly study hours bar chart data
  const weeklyChartData = {
    labels: weekly_study.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Study Hours',
        data: weekly_study.data || [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        hoverBackgroundColor: '#6366f1',
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  };

  const weeklyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.parsed.y} hours`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' },
        beginAtZero: true
      }
    }
  };

  // Quiz timeline line chart
  const quizChartData = {
    labels: quiz_timeline.length > 0 ? quiz_timeline.map(q => q.date) : ['Quiz 1', 'Quiz 2', 'Quiz 3'],
    datasets: [
      {
        label: 'Accuracy %',
        data: quiz_timeline.length > 0 ? quiz_timeline.map(q => q.percentage) : [70, 85, 80],
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#06b6d4',
        pointRadius: 5
      }
    ]
  };

  const quizChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.parsed.y}% score`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' },
        min: 0,
        max: 100
      }
    }
  };

  const readinessScore = readiness.readiness_percentage || 65;
  const components = readiness.components || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={24} color="var(--primary)" /> Progress & Analytics
        </h2>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Real-time metrics, syllabus mastery, quiz timeline, and exam preparation readiness.
        </p>
      </div>

      {/* Exam Readiness Master Card */}
      <div className="card" style={{
        padding: '30px',
        background: 'linear-gradient(135deg, rgba(19, 28, 49, 0.95) 0%, rgba(13, 20, 36, 0.98) 100%)',
        border: '1px solid var(--border-highlight)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-primary">Comprehensive Metric</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Formula weighted</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Exam Preparation Readiness
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {readiness.interpretation}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: readinessScore >= 80 ? 'var(--success)' : readinessScore >= 50 ? 'var(--warning)' : 'var(--danger)', lineHeight: 1 }}>
              {readinessScore}%
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Readiness Score
            </span>
          </div>
        </div>

        {/* 4 Component Bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Syllabus Mastered', val: components.syllabus_completion || 60, weight: '35% weight', color: 'var(--primary)' },
            { label: 'Spaced Revisions', val: components.revision_completion || 50, weight: '25% weight', color: 'var(--accent-cyan)' },
            { label: 'Quiz Accuracy', val: components.quiz_mastery || 75, weight: '25% weight', color: 'var(--warning)' },
            { label: 'Study Consistency', val: components.study_consistency || 80, weight: '15% weight', color: 'var(--success)' }
          ].map((c, i) => (
            <div key={i} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-main)' }}>{c.label}</span>
                <span style={{ color: c.color, fontWeight: 700 }}>{c.val}%</span>
              </div>
              <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${c.val}%`, background: c.color, borderRadius: '3px' }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px' }}>{c.weight}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Charts Grid */}
      <div className="grid-2">
        {/* Weekly Study Hours */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Weekly Study Logged (Hours)
            </h3>
            <Clock size={18} color="var(--primary)" />
          </div>
          <div style={{ height: '240px' }}>
            <Bar data={weeklyChartData} options={weeklyChartOptions} />
          </div>
        </div>

        {/* Quiz Timeline */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Quiz Accuracy Progression
            </h3>
            <TrendingUp size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ height: '240px' }}>
            <Line data={quizChartData} options={quizChartOptions} />
          </div>
        </div>
      </div>

      {/* Subject Progress Section */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '18px' }}>
          Subject Syllabus Completion
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {subject_progress.map(sub => (
            <div key={sub.subject_id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>
                <span style={{ color: '#ffffff' }}>{sub.name}</span>
                <span style={{ color: sub.color || 'var(--primary)' }}>
                  {sub.mastered_topics} / {sub.total_topics} Topics ({sub.percentage}%)
                </span>
              </div>
              <div style={{ height: '8px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${sub.percentage}%`, background: sub.color || 'var(--primary)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Knowledge Gaps Engine Output */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px' }}>
              Knowledge Gap Detector Radar
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Backend-calculated vulnerability index based on mistakes, quiz misses, and confidence ratings.
            </p>
          </div>
          <AlertTriangle size={20} color="var(--warning)" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {knowledge_gaps.map((g, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{g.topic_name}</span>
                  <span className="badge" style={{ background: `${g.subject_color || '#6366f1'}20`, color: g.subject_color || '#818cf8' }}>
                    {g.subject_name}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {g.recommendation}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span className={`badge ${g.gap_level === 'HIGH' ? 'badge-danger' : g.gap_level === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
                  {g.gap_level} Risk ({g.gap_score}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
