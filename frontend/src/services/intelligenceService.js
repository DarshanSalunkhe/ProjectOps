import api from './api';

export const intelligenceService = {
  // AI Planner
  async generatePlan(planRequest) {
    const response = await api.post('/ai/planner/generate', planRequest);
    return response.data;
  },

  async applyPlan(projectId, plan) {
    const response = await api.post(`/ai/planner/apply/${projectId}`, { plan });
    return response.data;
  },

  // Risk Detection
  async detectRisks(projectId) {
    const response = await api.get(`/intelligence/risks/${projectId}`);
    return response.data;
  },

  // Impact Analysis
  async analyzeImpact(taskId, delayDays = 2) {
    const response = await api.post(`/intelligence/impact/${taskId}`, { delayDays });
    return response.data;
  },

  // Replanning
  async generateReplan(projectId, problem) {
    const response = await api.post(`/intelligence/replan/${projectId}`, { problem });
    return response.data;
  },

  async getReplans(projectId) {
    const response = await api.get(`/intelligence/replan/${projectId}/proposals`);
    return response.data;
  },

  async applyReplan(projectId, proposalId) {
    const response = await api.post(`/intelligence/replan/${projectId}/proposals/${proposalId}/apply`);
    return response.data;
  },

  async rejectReplan(projectId, proposalId) {
    const response = await api.post(`/intelligence/replan/${projectId}/proposals/${proposalId}/reject`);
    return response.data;
  },

  // Project Health
  async getProjectHealth(projectId) {
    const response = await api.get(`/intelligence/health/${projectId}`);
    return response.data;
  },

  // Personalized plan grounded in project data
  async generatePersonalizedPlan(projectId, instructions, constraints) {
    const response = await api.post(`/ai/planner/personalized/${projectId}`, { instructions, constraints });
    return response.data;
  },

  // GitHub repository info
  async getRepository(projectId) {
    const response = await api.get(`/github/projects/${projectId}/repository`);
    return response.data;
  },

  // AI Chat
  async chat(projectId, message, history = []) {
    const response = await api.post(`/ai/planner/chat/${projectId}`, { message, history });
    return response.data;
  }
};
