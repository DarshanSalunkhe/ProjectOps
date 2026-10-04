import { projectService } from '../services/projectService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user.id);
  successResponse(res, project, 'Project created successfully', 201);
});

export const getAllProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getAllProjects();
  successResponse(res, projects, 'Projects retrieved successfully');
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id);
  successResponse(res, project, 'Project retrieved successfully');
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body);
  successResponse(res, project, 'Project updated successfully');
});

export const deleteProject = asyncHandler(async (req, res) => {
  const result = await projectService.deleteProject(req.params.id);
  successResponse(res, result, 'Project deleted successfully');
});

export const getStatistics = asyncHandler(async (req, res) => {
  const stats = await projectService.getStatistics();
  successResponse(res, stats, 'Statistics retrieved successfully');
});
