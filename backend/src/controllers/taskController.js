import { taskService } from '../services/taskService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';

export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user.id);
  successResponse(res, task, 'Task created successfully', 201);
});

export const getTasksByProject = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTasksByProject(req.params.projectId);
  successResponse(res, tasks, 'Tasks retrieved successfully');
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  successResponse(res, task, 'Task retrieved successfully');
});

export const getAllTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getAllTasks(req.user.id);
  successResponse(res, tasks, 'Tasks retrieved successfully');
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.body);
  successResponse(res, task, 'Task updated successfully');
});

export const deleteTask = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask(req.params.id);
  successResponse(res, result, 'Task deleted successfully');
});

export const assignTask = asyncHandler(async (req, res) => {
  const result = await taskService.assignTaskToUser(req.params.id, req.body.user_id);
  successResponse(res, result, 'Task assigned successfully');
});

export const unassignTask = asyncHandler(async (req, res) => {
  const result = await taskService.unassignTaskFromUser(req.params.id, req.params.userId);
  successResponse(res, result, 'Task unassigned successfully');
});

export const getStatistics = asyncHandler(async (req, res) => {
  const stats = await taskService.getStatisticsByUser(req.user.id);
  successResponse(res, stats, 'Statistics retrieved successfully');
});
