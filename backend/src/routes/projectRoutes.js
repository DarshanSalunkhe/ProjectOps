import express from 'express';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getStatistics
} from '../controllers/projectController.js';
import { createTask, getTasksByProject } from '../controllers/taskController.js';
import { getProjectDependencyGraph } from '../controllers/dependencyController.js';
import { createProjectValidation, updateProjectValidation } from '../validators/projectValidators.js';
import { createTaskValidation, projectIdValidation } from '../validators/taskValidators.js';
import { authenticate } from '../middleware/auth.js';
import { idValidation } from '../validators/common.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Statistics endpoint
router.get('/statistics', getStatistics);

// Project dependency graph
router.get('/:projectId/dependencies/graph', projectIdValidation, getProjectDependencyGraph);

// Project tasks endpoints
router.post('/:projectId/tasks', projectIdValidation, createTaskValidation, createTask);
router.get('/:projectId/tasks', projectIdValidation, getTasksByProject);

// CRUD endpoints
router.post('/', createProjectValidation, createProject);
router.get('/', getAllProjects);
router.get('/:id', idValidation, getProjectById);
router.patch('/:id', idValidation, updateProjectValidation, updateProject);
router.delete('/:id', idValidation, deleteProject);

export default router;
