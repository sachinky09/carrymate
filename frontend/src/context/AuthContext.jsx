import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('carrymate_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((token, userData) => {
    localStorage.setItem('carrymate_token', token);
    localStorage.setItem('carrymate_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('[ERROR] file=src/context/AuthContext.jsx message=logout request failed', error);
    }
    localStorage.removeItem('carrymate_token');
    localStorage.removeItem('carrymate_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
