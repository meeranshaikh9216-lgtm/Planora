import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const FocusContext = createContext(null);

export const FocusProvider = ({ children }) => {
  // Load initial state from localStorage if active session exists
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem('planora_focus_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isActive && parsed.targetEndTime) {
          const now = Date.now();
          const remaining = Math.max(0, Math.round((parsed.targetEndTime - now) / 1000));
          return {
            ...parsed,
            secondsRemaining: remaining,
            isActive: remaining > 0
          };
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error reading focus state:', e);
    }
    return {
      isActive: false,
      targetMinutes: 25,
      secondsRemaining: 25 * 60,
      subjectId: null,
      subjectName: '',
      targetEndTime: null,
      distractionCount: 0,
      soundEnabled: true,
      sessionCompleted: false,
      earnedXp: 0
    };
  };

  const [state, setState] = useState(getInitialState);
  const [distractionAlert, setDistractionAlert] = useState(false);
  const timerRef = useRef(null);

  // Play audio chime via Web Audio API without needing external mp3 files
  const playWebAudioChime = (type = 'success') => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'distraction') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Celebratory chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (err) {
      console.warn('AudioContext chime not permitted:', err);
    }
  };

  // Synchronize state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('planora_focus_session', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to persist focus state:', e);
    }
  }, [state]);

  // Active Timer Interval
  useEffect(() => {
    if (state.isActive && state.secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.isActive) return prev;
          if (prev.targetEndTime) {
            const remaining = Math.max(0, Math.round((prev.targetEndTime - Date.now()) / 1000));
            if (remaining === 0) {
              clearInterval(timerRef.current);
              finishFocus();
              return { ...prev, secondsRemaining: 0, isActive: false };
            }
            return { ...prev, secondsRemaining: remaining };
          } else {
            const nextSec = prev.secondsRemaining - 1;
            if (nextSec <= 0) {
              clearInterval(timerRef.current);
              finishFocus();
              return { ...prev, secondsRemaining: 0, isActive: false };
            }
            return { ...prev, secondsRemaining: nextSec };
          }
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isActive]);

  // Tab Sentinel: Track when student leaves tab / window during an active focus session
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state.isActive) {
        setState(prev => ({
          ...prev,
          distractionCount: prev.distractionCount + 1
        }));
        setDistractionAlert(true);
        if (state.soundEnabled) {
          playWebAudioChime('distraction');
        }
      } else if (!document.hidden && state.isActive && state.targetEndTime) {
        // Mobile PWA background resume: immediately reconcile wall-clock elapsed time
        const remaining = Math.max(0, Math.round((state.targetEndTime - Date.now()) / 1000));
        setState(prev => ({
          ...prev,
          secondsRemaining: remaining,
          isActive: remaining > 0
        }));
      }
    };

    const handleWindowBlur = () => {
      if (state.isActive) {
        setState(prev => ({
          ...prev,
          distractionCount: prev.distractionCount + 1
        }));
        setDistractionAlert(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [state.isActive, state.soundEnabled]);

  // Auto-dismiss distraction warning alert after 5 seconds
  useEffect(() => {
    if (distractionAlert) {
      const t = setTimeout(() => setDistractionAlert(false), 5000);
      return () => clearTimeout(t);
    }
  }, [distractionAlert]);

  const startFocus = ({ subjectId = null, subjectName = '', minutes = 25 }) => {
    const totalSec = minutes * 60;
    const targetEndTime = Date.now() + totalSec * 1000;
    setState({
      isActive: true,
      targetMinutes: minutes,
      secondsRemaining: totalSec,
      subjectId,
      subjectName,
      targetEndTime,
      distractionCount: 0,
      soundEnabled: true,
      sessionCompleted: false,
      earnedXp: 0
    });
    if (state.soundEnabled) {
      playWebAudioChime('success');
    }
  };

  const pauseFocus = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      targetEndTime: null
    }));
  };

  const resumeFocus = () => {
    setState(prev => ({
      ...prev,
      isActive: true,
      targetEndTime: Date.now() + prev.secondsRemaining * 1000
    }));
  };

  const resetFocus = (mins = null) => {
    const target = mins || state.targetMinutes || 25;
    setState(prev => ({
      ...prev,
      isActive: false,
      targetMinutes: target,
      secondsRemaining: target * 60,
      targetEndTime: null,
      sessionCompleted: false,
      distractionCount: 0
    }));
  };

  const finishFocus = async () => {
    const actualMinutes = Math.max(1, Math.round((state.targetMinutes * 60 - state.secondsRemaining) / 60));
    try {
      const res = await api.completeFocus({
        duration_minutes: state.targetMinutes,
        actual_minutes: actualMinutes,
        subject_id: state.subjectId ? parseInt(state.subjectId) : null
      });
      const xp = res.data?.xp_earned || actualMinutes;
      setState(prev => ({
        ...prev,
        isActive: false,
        sessionCompleted: true,
        earnedXp: xp,
        targetEndTime: null
      }));
      if (state.soundEnabled) {
        playWebAudioChime('success');
      }
    } catch (err) {
      console.error('Failed to log completed focus session:', err);
      setState(prev => ({ ...prev, isActive: false, sessionCompleted: true, earnedXp: actualMinutes }));
    }
  };

  const toggleSound = () => {
    setState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  return (
    <FocusContext.Provider value={{
      ...state,
      distractionAlert,
      dismissDistractionAlert: () => setDistractionAlert(false),
      startFocus,
      pauseFocus,
      resumeFocus,
      resetFocus,
      finishFocus,
      toggleSound
    }}>
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
};
