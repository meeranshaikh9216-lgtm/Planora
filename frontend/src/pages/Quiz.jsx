import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Award, Sparkles, Clock, CheckCircle, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topicIdParam = searchParams.get('topic_id');

  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Quiz Playing State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Generate modal state
  const [showGenModal, setShowGenModal] = useState(false);
  const [genSubjectId, setGenSubjectId] = useState('');
  const [genTopicId, setGenTopicId] = useState(topicIdParam || '');
  const [genDifficulty, setGenDifficulty] = useState('Medium');
  const [genNumQuestions, setGenNumQuestions] = useState(5);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const loadData = async () => {
    try {
      const [qRes, subRes] = await Promise.all([
        api.listQuizzes(),
        api.listSubjects()
      ]);
      setQuizzes(qRes?.data?.quizzes || []);
      const subs = subRes?.data?.subjects || [];
      setSubjects(subs);
      if (subs.length > 0 && !genSubjectId) {
        setGenSubjectId(subs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (quizId) => {
    try {
      const res = await api.getQuiz(quizId, false);
      setActiveQuiz(res.data.quiz);
      setCurrentQIndex(0);
      setSelectedAnswers({});
      setSecondsElapsed(0);
      setTimerActive(true);
    } catch (err) {
      alert("Failed to start quiz: " + err.message);
    }
  };

  const handleOptionSelect = (qId, optionKey) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionKey }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    setTimerActive(false);

    try {
      const res = await api.submitQuiz(activeQuiz.id, {
        answers: selectedAnswers,
        time_taken_seconds: secondsElapsed
      });
      navigate(`/quiz-result/${res.data.attempt_id}`, { state: { resultData: res.data } });
    } catch (err) {
      alert("Quiz submission failed: " + err.message);
      setTimerActive(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.generateQuiz({
        subject_id: genSubjectId,
        topic_id: genTopicId ? parseInt(genTopicId) : null,
        difficulty: genDifficulty,
        num_questions: genNumQuestions
      });
      setShowGenModal(false);
      await loadData();
      handleStartQuiz(res.data.quiz.id);
    } catch (err) {
      alert("Quiz generation failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={3} height="80px" />;
  }

  // ACTIVE QUIZ INTERFACE
  if (activeQuiz) {
    const questions = activeQuiz.questions || [];
    const currentQ = questions[currentQIndex];
    const total = questions.length;
    const isAnswered = selectedAnswers[currentQ?.id] !== undefined;

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Quiz Top bar */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
              {activeQuiz.title}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Question {currentQIndex + 1} of {total}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: 'var(--accent-cyan)'
          }}>
            <Clock size={16} />
            <span>
              {Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.5, margin: 0 }}>
              {currentQ.question_text}
            </h4>

            {/* Options list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['A', 'B', 'C', 'D'].map(optKey => {
                const optText = currentQ.options[optKey];
                if (!optText) return null;
                const isSelected = selectedAnswers[currentQ.id] === optKey;

                return (
                  <button
                    key={optKey}
                    type="button"
                    onClick={() => handleOptionSelect(currentQ.id, optKey)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.95rem',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      flexShrink: 0
                    }}>
                      {optKey}
                    </div>
                    <span>{optText}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                className="btn btn-secondary"
                disabled={currentQIndex === 0}
              >
                <ArrowLeft size={16} /> Previous
              </button>

              {currentQIndex < total - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQIndex(prev => Math.min(total - 1, prev + 1))}
                  className="btn btn-primary"
                >
                  Next Question <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ background: 'linear-gradient(135deg, var(--success) 0%, #059669 100%)' }}
                >
                  {submitting ? 'Submitting & Evaluating...' : 'Submit Final Quiz'} <CheckCircle size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // QUIZ LIST & GENERATOR VIEW
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={24} color="var(--warning)" /> AI Quizzes & Active Recall
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Instant multiple-choice quizzes with automated Python scoring and Mistake Bank syncing.
          </p>
        </div>

        <button onClick={() => setShowGenModal(true)} className="btn btn-primary">
          <Sparkles size={18} /> Generate New AI Quiz
        </button>
      </div>

      {/* Quizzes List */}
      <div className="grid-2">
        {quizzes.length === 0 ? (
          <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No quizzes created yet.</p>
            <button onClick={() => setShowGenModal(true)} className="btn btn-primary">
              <Sparkles size={18} /> Generate Quiz with AI
            </button>
          </div>
        ) : (
          quizzes.map(q => (
            <div key={q.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge badge-primary">{q.subject_name || 'Subject'}</span>
                  <span className={`badge ${q.difficulty === 'Hard' ? 'badge-danger' : q.difficulty === 'Easy' ? 'badge-success' : 'badge-warning'}`}>
                    {q.difficulty}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '6px 0 4px' }}>
                  {q.title}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  {q.total_questions} Questions • Instant evaluation
                </div>
              </div>

              <button
                onClick={() => handleStartQuiz(q.id)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Start Quiz <ArrowRight size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Generate Quiz Modal */}
      {showGenModal && (
        <div className="modal-overlay" onClick={() => setShowGenModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
              Generate AI Quiz
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Planora will synthesize multiple-choice questions tailored to your syllabus.
            </p>

            <form onSubmit={handleGenerateQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Subject</label>
                <select className="select" value={genSubjectId} onChange={(e) => setGenSubjectId(e.target.value)} required>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Difficulty</label>
                  <select className="select" value={genDifficulty} onChange={(e) => setGenDifficulty(e.target.value)}>
                    <option value="Easy">Easy (Fundamentals)</option>
                    <option value="Medium">Medium (Exam Standard)</option>
                    <option value="Hard">Hard (Competitive Level)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Questions Count</label>
                  <select className="select" value={genNumQuestions} onChange={(e) => setGenNumQuestions(parseInt(e.target.value))}>
                    <option value={3}>3 Questions (Quick)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={10}>10 Questions (Comprehensive)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowGenModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={generating}>
                  {generating ? 'AI Generating Questions...' : 'Generate & Play Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
