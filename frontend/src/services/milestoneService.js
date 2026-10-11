import api from './api';

export const milestoneService = {
  async create(projectId, milestoneData) {
    const response = await api.post(`/milestones/projects/${projectId}/milestones`, milestoneData);
    return response.data || response;
  },

  async getByProject(projectId) {
    const response = await api.get(`/milestones/projects/${projectId}/milestones`);
    return response.data || response;
  },

  async update(id, updates) {
    const response = await api.put(`/milestones/milestones/${id}`, updates);
    return response.data || response;
  },

  async delete(id) {
    const response = await api.delete(`/milestones/milestones/${id}`);
    return response.data || response;
  },

  async awardContribution(milestoneId, userId, points, feedback = '') {
    const response = await api.post(`/milestones/milestones/${milestoneId}/contributions`, { user_id: userId, points, feedback });
    return response.data || response;
  }
};
