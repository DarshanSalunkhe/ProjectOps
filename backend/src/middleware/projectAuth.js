import { AppError } from './errorHandler.js';
import { projectMemberRepository } from '../repositories/projectMemberRepository.js';
import pool from '../config/database.js';

/**
 * Middleware to verify user is a member of the project
 * Expects projectId to be available in req.params.id, req.params.projectId, or req.body.project_id
 */
export const requireProjectMember = async (req, res, next) => {
  try {
    // Extract project ID from various sources
    const projectId = req.params.id || req.params.projectId || req.body.project_id;
    
    // For task routes, get project_id from task
    if (!projectId && req.params.taskId) {
      const taskResult = await pool.query(
        'SELECT project_id FROM tasks WHERE id = $1',
        [req.params.taskId]
      );
      if (taskResult.rows.length > 0) {
        req.params.projectId = taskResult.rows[0].project_id;
        return requireProjectMember(req, res, next);
      }
    }
    
    if (!projectId) {
      throw new AppError('Project ID required', 400);
    }
    
    if (!req.user || !req.user.id) {
      throw new AppError('User not authenticated', 401);
    }
    
    // System admins have access to all projects
    if (req.user.role === 'SYSTEM_ADMIN') {
      req.projectRole = 'OWNER';
      return next();
    }
    
    // Check project membership
    const membership = await projectMemberRepository.findByProjectAndUser(
      parseInt(projectId),
      req.user.id
    );
    
    if (!membership) {
      throw new AppError('You are not a member of this project', 403);
    }
    
    // Attach project role to request
    req.projectRole = membership.role;
    req.projectMember = membership;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to verify user is a developer or owner of the project
 */
export const requireDeveloperOrOwner = async (req, res, next) => {
  if (!req.projectRole) {
    return next(new AppError('Project membership not verified', 500));
  }
  
  if (req.projectRole === 'VIEWER') {
    return next(new AppError('This action requires DEVELOPER or OWNER role', 403));
  }
  
  next();
};

/**
 * Middleware to verify user is project owner
 */
export const requireProjectOwner = async (req, res, next) => {
  if (!req.projectRole) {
    return next(new AppError('Project membership not verified', 500));
  }
  
  if (req.projectRole !== 'OWNER') {
    return next(new AppError('This action requires OWNER role', 403));
  }
  
  next();
};

/**
 * Middleware to verify user has access to a specific task via project membership
 */
export const requireTaskAccess = async (req, res, next) => {
  try {
    const taskId = req.params.id || req.params.taskId;
    
    if (!taskId) {
      throw new AppError('Task ID required', 400);
    }
    
    // Get task's project_id
    const taskResult = await pool.query(
      'SELECT project_id FROM tasks WHERE id = $1',
      [taskId]
    );
    
    if (taskResult.rows.length === 0) {
      throw new AppError('Task not found', 404);
    }
    
    const projectId = taskResult.rows[0].project_id;
    req.params.projectId = projectId;
    
    // Use project membership check
    return requireProjectMember(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to verify user has access to a milestone via project membership
 */
export const requireMilestoneAccess = async (req, res, next) => {
  try {
    const milestoneId = req.params.id || req.params.milestoneId;
    
    if (!milestoneId) {
      throw new AppError('Milestone ID required', 400);
    }
    
    // Get milestone's project_id
    const result = await pool.query(
      'SELECT project_id FROM milestones WHERE id = $1',
      [milestoneId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Milestone not found', 404);
    }
    
    const projectId = result.rows[0].project_id;
    req.params.projectId = projectId;
    
    // Use project membership check
    return requireProjectMember(req, res, next);
  } catch (error) {
    next(error);
  }
};

