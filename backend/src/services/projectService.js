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

  async getAllProjects(userId) {
    const projects = await projectRepository.findAllByUser(userId);
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

  async archiveProject(id) {
    const existingProject = await projectRepository.findById(id);
    if (!existingProject) {
      throw new AppError('Project not found', 404);
    }

    const project = await projectRepository.update(id, {
      archived: true,
      archived_at: new Date()
    });

    return project;
  },

  async restoreProject(id) {
    const existingProject = await projectRepository.findById(id);
    if (!existingProject) {
      throw new AppError('Project not found', 404);
    }

    const project = await projectRepository.update(id, {
      archived: false,
      archived_at: null
    });

    return project;
  },

  async getStatistics() {
    const stats = await projectRepository.getStatistics();
    return stats;
  },

  async getStatisticsByUser(userId) {
    const stats = await projectRepository.getStatisticsByUser(userId);
    return stats;
  }
};
