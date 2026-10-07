import api from './api';

export const authService = {
  async register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async me() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(updates) {
    const response = await api.patch('/auth/me', updates);
    return response.data;
  },

  async getAllUsers() {
    const response = await api.get('/auth/users');
    return response.data;
  },

  async updateUserRole(userId, role) {
    const response = await api.patch(`/auth/users/${userId}/role`, { role });
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
  }
};
