import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('vera_token'));
  const [loading, setLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState(null);

  // Listen for global session expiration events dispatched by apiClient
  useEffect(() => {
    const handleSessionExpired = (e) => {
      localStorage.removeItem('vera_token');
      setToken(null);
      setUser(null);
      setAuthNotice(e.detail?.message || 'Your session has expired. Please sign in again.');
    };

    window.addEventListener('vera:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('vera:session-expired', handleSessionExpired);
    };
  }, []);

  // Restore authenticated session on app mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedToken = localStorage.getItem('vera_token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getMe(storedToken);
        if (isMounted) {
          setUser(currentUser);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out.');
        localStorage.removeItem('vera_token');
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('vera_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    localStorage.setItem('vera_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const loginWithGoogle = async (profile = {}) => {
    const data = await authService.loginWithGoogle(profile);
    localStorage.setItem('vera_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('vera_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    authNotice,
    clearAuthNotice: () => setAuthNotice(null),
    login,
    loginWithGoogle,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
