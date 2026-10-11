import api from './api';

export const activityService = {
  async getByProject(projectId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    const response = await api.get(`/activity/projects/${projectId}/activity`, {
      params: { limit, offset }
    });
    return response.data || response;
  }
};
