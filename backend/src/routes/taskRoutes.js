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
import { requireTaskAccess, requireDeveloperOrOwner } from '../middleware/projectAuth.js';
import { idValidation } from '../validators/common.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Statistics endpoint (no specific project filtering - shows user's accessible tasks)
router.get('/statistics', getStatistics);

// Get all tasks (filtered by user's project memberships)
router.get('/', getAllTasks);

// Task-specific routes (require task access via project membership)
router.get('/:id', 
  idValidation,
  requireTaskAccess,
  getTaskById
);

router.patch('/:id', 
  idValidation,
  requireTaskAccess,
  requireDeveloperOrOwner,
  updateTaskValidation,
  updateTask
);

router.delete('/:id', 
  idValidation,
  requireTaskAccess,
  requireDeveloperOrOwner,
  deleteTask
);

// Task assignments (require task access)
router.post('/:id/assign', 
  idValidation,
  requireTaskAccess,
  requireDeveloperOrOwner,
  assignTaskValidation,
  assignTask
);

router.delete('/:id/assign/:userId', 
  idValidation,
  requireTaskAccess,
  requireDeveloperOrOwner,
  unassignTask
);

// Task dependencies (require task access)
router.post('/:taskId/dependencies', 
  taskIdParamValidation,
  requireTaskAccess,
  requireDeveloperOrOwner,
  createDependencyValidation,
  createDependency
);

router.get('/:taskId/dependencies', 
  taskIdParamValidation,
  requireTaskAccess,
  getTaskDependencies
);

router.get('/:taskId/dependents', 
  taskIdParamValidation,
  requireTaskAccess,
  getDependentTasks
);

router.delete('/:taskId/dependencies/:dependencyId', 
  taskIdParamValidation,
  requireTaskAccess,
  requireDeveloperOrOwner,
  dependencyIdValidation,
  deleteDependency
);

export default router;
