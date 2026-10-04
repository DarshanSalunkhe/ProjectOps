import { body, param } from 'express-validator';
import { validate, enumValidation, dateValidation } from './common.js';

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];
const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const createTaskValidation = [
  body('project_id')
    .isInt({ min: 1 })
    .withMessage('Valid project ID is required'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 255 })
    .withMessage('Task title must not exceed 255 characters'),
  
  body('description')
    .optional()
    .trim(),
  
  enumValidation('status', TASK_STATUSES),
  
  enumValidation('priority', TASK_PRIORITIES),
  
  body('estimated_hours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  
  dateValidation('deadline'),
  
  validate
];

export const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Task title must not exceed 255 characters'),
  
  body('description')
    .optional()
    .trim(),
  
  enumValidation('status', TASK_STATUSES),
  
  enumValidation('priority', TASK_PRIORITIES),
  
  body('estimated_hours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  
  body('actual_hours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual hours must be a positive number'),
  
  dateValidation('deadline'),
  
  validate
];

export const assignTaskValidation = [
  body('user_id')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  
  validate
];

export const projectIdValidation = [
  param('projectId')
    .isInt({ min: 1 })
    .withMessage('Valid project ID is required'),
  
  validate
];
