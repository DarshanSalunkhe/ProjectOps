import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Handle specific status codes
      const requestToken = error.config?.headers?.Authorization;
      const currentToken = localStorage.getItem('token');
      if (error.response.status === 401 && requestToken &&
          requestToken === `Bearer ${currentToken}` &&
          !/^\/?auth\/(login|register)(?:\?|$)/.test(error.config?.url || '')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      // Return the error response data
      return Promise.reject(error.response.data);
    }
    
    // Network error or other issues
    return Promise.reject({
      success: false,
      message: error.code === 'ECONNABORTED'
        ? 'Sign in timed out. Please try again.'
        : 'Unable to reach the server. Please check your connection and try again.'
    });
  }
);

export default api;
