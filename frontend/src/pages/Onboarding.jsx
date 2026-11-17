import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Clock, Target, ArrowRight, ArrowLeft, Check, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Economics',
  'English'
];

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [gradeClass, setGradeClass] = useState('Grade 12');
  const [board, setBoard] = useState('CBSE');
  const [stream, setStream] = useState('Science (PCM)');
  const [selectedSubjects, setSelectedSubjects] = useState(['Mathematics', 'Physics', 'Chemistry']);
  const [customSubject, setCustomSubject] = useState('');
  const [dailyHours, setDailyHours] = useState(4.0);
  const [preferredTime, setPreferredTime] = useState('evening');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [studyGoal, setStudyGoal] = useState('Score 95%+ in Board Examination');

  const toggleSubject = (sub) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const addCustomSubject = (e) => {
    e.preventDefault();
    if (customSubject.trim() && !selectedSubjects.includes(customSubject.trim())) {
      setSelectedSubjects([...selectedSubjects, customSubject.trim()]);
      setCustomSubject('');
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await api.completeOnboarding({
        name,
        grade_class: gradeClass,
        board,
        stream,
        subjects: selectedSubjects,
        daily_study_hours: dailyHours,
        preferred_study_time: preferredTime,
        exam_date: examDate,
        study_goal: studyGoal
      });
      updateUser(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      alert(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '40px' }}>
        {/* Progress indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: s !== 3 ? 1 : 'none' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step === s ? 'var(--primary)' : step > s ? 'var(--success)' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                {step > s ? <Check size={16} /> : s}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: step === s ? '#ffffff' : 'var(--text-muted)' }}>
                {s === 1 ? 'Academics' : s === 2 ? 'Subjects' : 'Study Plan'}
              </span>
              {s !== 3 && <div style={{ flex: 1, height: '2px', background: step > s ? 'var(--success)' : 'var(--border-subtle)', margin: '0 12px' }} />}
            </div>
          ))}
        </div>

        {/* STEP 1: Academic Profile */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                Academic Profile
              </h2>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Tell Planora about your current grade and curriculum.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label className="label">Your Name</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Student Name"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label">Grade / Class</label>
                  <select className="select" value={gradeClass} onChange={(e) => setGradeClass(e.target.value)}>
                    <option value="Grade 10">Grade 10 (Secondary)</option>
                    <option value="Grade 11">Grade 11 (Senior Secondary)</option>
                    <option value="Grade 12">Grade 12 (Board Exam)</option>
                    <option value="College Year 1">College / University Yr 1</option>
                    <option value="College Year 2">College / University Yr 2</option>
                  </select>
                </div>
                <div>
                  <label className="label">Educational Board</label>
                  <select className="select" value={board} onChange={(e) => setBoard(e.target.value)}>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE / ISC">ICSE / ISC</option>
                    <option value="State Board">State Board</option>
                    <option value="IB / Cambridge">IB / Cambridge</option>
                    <option value="General University">General University</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Academic Stream</label>
                <select className="select" value={stream} onChange={(e) => setStream(e.target.value)}>
                  <option value="Science (PCM)">Science (PCM - Physics, Chem, Math)</option>
                  <option value="Science (PCB)">Science (PCB - Physics, Chem, Bio)</option>
                  <option value="Commerce">Commerce with Mathematics</option>
                  <option value="Humanities / Arts">Humanities / Arts</option>
                  <option value="Engineering">Engineering / Computer Science</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
              <button onClick={() => setStep(2)} className="btn btn-primary">
                Next: Select Subjects <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Choose Subjects */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                Select Your Subjects
              </h2>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Pick all subjects you are preparing for. Planora auto-provisions chapters so you don't have to type them all.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              {DEFAULT_SUBJECTS.map((sub) => {
                const selected = selectedSubjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '999px',
                      border: selected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: selected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: selected ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {selected && <Check size={16} color="var(--primary)" />}
                    {sub}
                  </button>
                );
              })}
            </div>

            {/* Custom Subject Input */}
            <form onSubmit={addCustomSubject} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="input"
                placeholder="Add other subject (e.g. Statistics)"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" style={{ flexShrink: 0 }}>
                <Plus size={18} /> Add
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary">
                <ArrowLeft size={18} /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="btn btn-primary"
                disabled={selectedSubjects.length === 0}
              >
                Next: Study Habits <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Study Habits & Exam Goal */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                Study Habits & Goals
              </h2>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                These parameters calibrate your AI Study Planner and Spaced Revision schedules.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label">Daily Study Target</label>
                  <select className="select" value={dailyHours} onChange={(e) => setDailyHours(parseFloat(e.target.value))}>
                    <option value={2.0}>2 Hours / day</option>
                    <option value={3.0}>3 Hours / day</option>
                    <option value={4.0}>4 Hours / day (Recommended)</option>
                    <option value={5.5}>5.5 Hours / day (Intense)</option>
                    <option value={7.0}>7 Hours / day (Marathon)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Preferred Study Window</label>
                  <select className="select" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)}>
                    <option value="morning">Morning (08:00 - 12:00)</option>
                    <option value="afternoon">Afternoon (13:30 - 17:30)</option>
                    <option value="evening">Evening (17:00 - 21:30)</option>
                    <option value="night">Night Owl (20:00 - 01:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Target Examination Date</label>
                <input
                  type="date"
                  className="input"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Target Goal / Dream Score</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Score 95% in Board Exams, Top 1% Rank"
                  value={studyGoal}
                  onChange={(e) => setStudyGoal(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <button onClick={() => setStep(2)} className="btn btn-secondary">
                <ArrowLeft size={18} /> Back
              </button>
              <button
                onClick={handleFinish}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating Your Coach...' : 'Launch Planora 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
