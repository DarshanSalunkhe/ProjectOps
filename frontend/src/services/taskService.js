import api from './api';

export const normalizeTaskPayload = (projectId, taskData) => {
  const payload = { ...taskData, project_id: projectId };
  if (payload.estimated_hours === '') delete payload.estimated_hours;
  if (payload.deadline === '') delete payload.deadline;
  return payload;
};

export const taskService = {
  async getByProject(projectId) {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async create(projectId, taskData) {
    const response = await api.post(`/projects/${projectId}/tasks`, normalizeTaskPayload(projectId, taskData));
    return response.data;
  },

  async update(id, taskData) {
    const response = await api.patch(`/tasks/${id}`, taskData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  async getDependencies(taskId) {
    const response = await api.get(`/tasks/${taskId}/dependencies`);
    return response.data;
  },

  async addDependency(taskId, dependsOnTaskId) {
    const response = await api.post(`/tasks/${taskId}/dependencies`, {
      depends_on_task_id: dependsOnTaskId
    });
    return response.data;
  },

  async removeDependency(taskId, dependencyId) {
    const response = await api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
    return response.data;
  }
};
