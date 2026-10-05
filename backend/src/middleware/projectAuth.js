import { projectMemberRepository } from '../repositories/projectMemberRepository.js';
import { taskRepository } from '../repositories/taskRepository.js';
import { AppError, asyncHandler } from './errorHandler.js';

/**
 * Middleware to check if the authenticated user is a member of the project
 * Attaches the membership details to req.projectMember
 */
export const requireProjectMember = asyncHandler(async (req, res, next) => {
  // Extract project ID from params (supports both :id and :projectId)
  const projectId = req.params.projectId || req.params.id;
  const userId = req.user.id;

  if (!projectId) {
    throw new AppError('Project ID is required', 400);
  }

  // Check if user is a member of the project
  const member = await projectMemberRepository.findByProjectAndUser(projectId, userId);

  if (!member) {
    throw new AppError('Access denied. You are not a member of this project.', 403);
  }

  // Attach member details to request for downstream use
  req.projectMember = member;
  next();
});

/**
 * Middleware to check if user has access to a task (via project membership)
 * Loads the task and checks project membership
 */
export const requireTaskAccess = asyncHandler(async (req, res, next) => {
  const taskId = req.params.taskId || req.params.id;
  const userId = req.user.id;

  if (!taskId) {
    throw new AppError('Task ID is required', 400);
  }

  // Get the task to find its project_id
  const task = await taskRepository.findById(taskId);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Check if user is a member of the task's project
  const member = await projectMemberRepository.findByProjectAndUser(task.project_id, userId);

  if (!member) {
    throw new AppError('Access denied. You are not a member of this project.', 403);
  }

  // Attach task and member details to request
  req.task = task;
  req.projectMember = member;
  next();
});

/**
 * Middleware to check if the user has specific role(s) in the project
 * Must be used after requireProjectMember or requireTaskAccess
 * 
 * @param {...string} roles - Allowed roles (e.g., 'OWNER', 'DEVELOPER')
 */
export const requireProjectRole = (...roles) => {
  return (req, res, next) => {
    if (!req.projectMember) {
      throw new AppError('Project membership check required before role check', 500);
    }

    if (!roles.includes(req.projectMember.role)) {
      throw new AppError(
        `Insufficient permissions. Required role: ${roles.join(' or ')}`,
        403
      );
    }

    next();
  };
};

/**
 * Middleware specifically for OWNER-only actions
 */
export const requireOwner = requireProjectRole('OWNER');

/**
 * Middleware for actions allowed by OWNER and DEVELOPER
 */
export const requireDeveloperOrOwner = requireProjectRole('OWNER', 'DEVELOPER');
