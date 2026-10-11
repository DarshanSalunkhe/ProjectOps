import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        const userData = await authService.me();
        if (localStorage.getItem('token') === token) setUser(userData);
      }
    } catch (error) {
      if (localStorage.getItem('token') === token) {
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await authService.logoutBackend();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state regardless of API call result
      authService.logout();
      setUser(null);
      window.location.href = '/login';
    }
  };

  // Memoize setToken to prevent useEffect re-runs in GoogleCallback
  const setToken = useCallback((token) => {
    localStorage.setItem('token', token);
  }, []);

  const value = {
    user,
    setUser,
    setToken,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
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
