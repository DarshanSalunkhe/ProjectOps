import { dependencyService } from '../services/dependencyService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';

export const createDependency = asyncHandler(async (req, res) => {
  const { depends_on_task_id, dependency_type } = req.body;
  const taskId = parseInt(req.params.taskId);

  const dependency = await dependencyService.createDependency(
    taskId,
    depends_on_task_id,
    dependency_type
  );

  successResponse(res, dependency, 'Dependency created successfully', 201);
});

export const getTaskDependencies = asyncHandler(async (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const dependencies = await dependencyService.getTaskDependencies(taskId);
  successResponse(res, dependencies, 'Dependencies retrieved successfully');
});

export const getDependentTasks = asyncHandler(async (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const dependentTasks = await dependencyService.getDependentTasks(taskId);
  successResponse(res, dependentTasks, 'Dependent tasks retrieved successfully');
});

export const deleteDependency = asyncHandler(async (req, res) => {
  const dependencyId = parseInt(req.params.dependencyId);
  const result = await dependencyService.deleteDependency(dependencyId, parseInt(req.params.taskId));
  successResponse(res, result, 'Dependency deleted successfully');
});

export const getProjectDependencyGraph = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.projectId);
  const graph = await dependencyService.getProjectDependencyGraph(projectId);
  successResponse(res, graph, 'Dependency graph retrieved successfully');
});
