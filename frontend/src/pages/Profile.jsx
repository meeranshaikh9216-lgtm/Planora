import React, { useState, useEffect } from 'react';
import { User, Award, Flame, Zap, CheckCircle, Edit3, Save, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [gradeClass, setGradeClass] = useState('');
  const [board, setBoard] = useState('');
  const [stream, setStream] = useState('');
  const [dailyHours, setDailyHours] = useState(4.0);
  const [studyGoal, setStudyGoal] = useState('');
  const [examDate, setExamDate] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [profRes, achRes] = await Promise.all([
        api.getProfile(),
        api.listAchievements()
      ]);
      const p = profRes?.data?.profile || {};
      const u = profRes?.data?.user || user;
      setProfile(p);
      setAchievements(achRes?.data?.achievements || []);

      setName(u.name || '');
      setGradeClass(p.grade_class || 'Grade 12');
      setBoard(p.board || 'CBSE');
      setStream(p.stream || 'Science');
      setDailyHours(p.daily_study_hours || 4.0);
      setStudyGoal(p.study_goal || '');
      setExamDate(p.exam_date || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateProfile({
        name,
        grade_class: gradeClass,
        board,
        stream,
        daily_study_hours: dailyHours,
        study_goal: studyGoal,
        exam_date: examDate
      });
      setProfile(res.data.profile);
      updateUser(res.data.user);
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return <LoadingSkeleton count={3} height="100px" />;
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Profile Header Card */}
      <div className="card" style={{
        padding: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        background: 'linear-gradient(135deg, rgba(19, 28, 49, 0.95) 0%, rgba(13, 20, 36, 0.98) 100%)',
        border: '1px solid var(--border-highlight)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.8rem',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {user?.name}
              </h2>
              <span className="badge badge-primary">{profile?.grade_class}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {user?.email} • {profile?.board} • {profile?.stream}
            </div>
          </div>
        </div>

        {/* Stats Badges */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fbbf24',
            fontWeight: 700
          }}>
            <Flame size={20} fill="#fbbf24" />
            <span>{user?.streak || 0} Day Streak</span>
          </div>

          <div style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#a5b4fc',
            fontWeight: 700
          }}>
            <Zap size={20} fill="#818cf8" />
            <span>{user?.xp || 0} XP</span>
          </div>
        </div>
      </div>

      <div className="two-col-responsive">
        {/* Profile Details & Edit */}
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
              Academic Profile
            </h3>
            <button
              onClick={() => setEditing(!editing)}
              className="btn btn-secondary btn-sm"
            >
              <Edit3 size={14} /> {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Full Name</label>
                <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label">Grade</label>
                  <input type="text" className="input" value={gradeClass} onChange={(e) => setGradeClass(e.target.value)} />
                </div>
                <div>
                  <label className="label">Board</label>
                  <input type="text" className="input" value={board} onChange={(e) => setBoard(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Stream</label>
                <input type="text" className="input" value={stream} onChange={(e) => setStream(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label">Daily Study Target</label>
                  <input type="number" step="0.5" className="input" value={dailyHours} onChange={(e) => setDailyHours(parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className="label">Exam Date</label>
                  <input type="date" className="input" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Target Goal</label>
                <input type="text" className="input" value={studyGoal} onChange={(e) => setStudyGoal(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                <Save size={16} /> Save Changes
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Daily Study Goal</span>
                <span style={{ fontWeight: 600, color: '#ffffff' }}>{profile?.daily_study_hours} Hours / day</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Preferred Window</span>
                <span style={{ fontWeight: 600, color: '#ffffff', textTransform: 'capitalize' }}>{profile?.preferred_study_time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Target Examination</span>
                <span style={{ fontWeight: 600, color: '#ffffff' }}>{profile?.exam_date || 'Not set'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Dream Target</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{profile?.study_goal || 'Excellence'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Gamification Achievements Showcase */}
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                Badges & Achievements
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {unlockedCount} of {achievements.length} Badges Unlocked
              </p>
            </div>
            <Award size={24} color="var(--warning)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {achievements.map((ach) => (
              <div
                key={ach.id}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: ach.unlocked ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: ach.unlocked ? '1px solid var(--border-highlight)' : '1px solid var(--border-subtle)',
                  opacity: ach.unlocked ? 1 : 0.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Award size={20} color={ach.unlocked ? 'var(--warning)' : 'var(--text-dim)'} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    +{ach.xp_reward} XP
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>
                  {ach.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {ach.description}
                </div>
                {ach.unlocked && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600, marginTop: '4px' }}>
                    ✓ Unlocked
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
