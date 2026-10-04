import { body, param } from 'express-validator';
import { validate, enumValidation } from './common.js';

const DEPENDENCY_TYPES = ['BLOCKS', 'RELATED'];

export const createDependencyValidation = [
  body('depends_on_task_id')
    .isInt({ min: 1 })
    .withMessage('Valid dependency task ID is required'),
  
  enumValidation('dependency_type', DEPENDENCY_TYPES),
  
  validate
];

export const taskIdParamValidation = [
  param('taskId')
    .isInt({ min: 1 })
    .withMessage('Valid task ID is required'),
  
  validate
];

export const dependencyIdValidation = [
  param('dependencyId')
    .isInt({ min: 1 })
    .withMessage('Valid dependency ID is required'),
  
  validate
];
