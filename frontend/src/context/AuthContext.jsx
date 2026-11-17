import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('planora_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('planora_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('planora_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('planora_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn("Session expired or invalid:", err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('planora_token', newToken);
    localStorage.setItem('planora_user', JSON.stringify(newUser));
    return res;
  };

  const adminLogin = async (email, password) => {
    const res = await api.adminLogin({ email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('planora_token', newToken);
    localStorage.setItem('planora_user', JSON.stringify(newUser));
    return res;
  };

  const signup = async (name, email, password) => {
    const res = await api.signup({ name, email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('planora_token', newToken);
    localStorage.setItem('planora_user', JSON.stringify(newUser));
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('planora_token');
    localStorage.removeItem('planora_user');
  };

  const updateUser = (updated) => {
    setUser(prev => {
      const merged = { ...prev, ...updated };
      localStorage.setItem('planora_user', JSON.stringify(merged));
      return merged;
    });
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, adminLogin, signup, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
