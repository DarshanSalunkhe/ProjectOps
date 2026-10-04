import { projectRepository } from '../repositories/projectRepository.js';
import { AppError } from '../middleware/errorHandler.js';

export const projectService = {
  async createProject(projectData, userId) {
    // Validate dates
    if (projectData.start_date && projectData.deadline) {
      const startDate = new Date(projectData.start_date);
      const deadline = new Date(projectData.deadline);
      
      if (deadline < startDate) {
        throw new AppError('Deadline cannot be before start date', 400);
      }
    }

    const project = await projectRepository.create(projectData, userId);
    return project;
  },

  async getAllProjects() {
    const projects = await projectRepository.findAll();
    return projects;
  },

  async getProjectById(id) {
    const project = await projectRepository.findById(id);
    
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    
    return project;
  },

  async updateProject(id, updates) {
    // Check if project exists
    const existingProject = await projectRepository.findById(id);
    if (!existingProject) {
      throw new AppError('Project not found', 404);
    }

    // Validate dates if both are provided
    const startDate = updates.start_date || existingProject.start_date;
    const deadline = updates.deadline || existingProject.deadline;
    
    if (startDate && deadline) {
      const start = new Date(startDate);
      const end = new Date(deadline);
      
      if (end < start) {
        throw new AppError('Deadline cannot be before start date', 400);
      }
    }

    const project = await projectRepository.update(id, updates);
    return project;
  },

  async deleteProject(id) {
    const existingProject = await projectRepository.findById(id);
    if (!existingProject) {
      throw new AppError('Project not found', 404);
    }

    await projectRepository.delete(id);
    return { message: 'Project deleted successfully' };
  },

  async getStatistics() {
    const stats = await projectRepository.getStatistics();
    return stats;
  }
};
