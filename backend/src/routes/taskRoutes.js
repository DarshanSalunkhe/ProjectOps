import express from 'express';
import {
  createTask,
  getTasksByProject,
  getTaskById,
  getAllTasks,
  updateTask,
  deleteTask,
  assignTask,
  unassignTask,
  getStatistics
} from '../controllers/taskController.js';
import {
  createDependency,
  getTaskDependencies,
  getDependentTasks,
  deleteDependency
} from '../controllers/dependencyController.js';
import {
  createTaskValidation,
  updateTaskValidation,
  assignTaskValidation,
  projectIdValidation
} from '../validators/taskValidators.js';
import {
  createDependencyValidation,
  taskIdParamValidation,
  dependencyIdValidation
} from '../validators/dependencyValidators.js';
import { authenticate } from '../middleware/auth.js';
import { idValidation } from '../validators/common.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Statistics endpoint
router.get('/statistics', getStatistics);

// Task dependencies
router.post('/:taskId/dependencies', taskIdParamValidation, createDependencyValidation, createDependency);
router.get('/:taskId/dependencies', taskIdParamValidation, getTaskDependencies);
router.get('/:taskId/dependents', taskIdParamValidation, getDependentTasks);
router.delete('/:taskId/dependencies/:dependencyId', taskIdParamValidation, dependencyIdValidation, deleteDependency);

// Task assignments
router.post('/:id/assign', idValidation, assignTaskValidation, assignTask);
router.delete('/:id/assign/:userId', idValidation, unassignTask);

// CRUD endpoints
router.get('/', getAllTasks);
router.get('/:id', idValidation, getTaskById);
router.patch('/:id', idValidation, updateTaskValidation, updateTask);
router.delete('/:id', idValidation, deleteTask);

export default router;
