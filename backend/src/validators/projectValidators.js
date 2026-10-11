import { body } from 'express-validator';
import { validate, enumValidation, dateValidation } from './common.js';

const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

export const createProjectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ max: 255 })
    .withMessage('Project name must not exceed 255 characters'),
  
  body('description')
    .optional()
    .trim(),
  
  body('goal')
    .optional()
    .trim(),
  
  enumValidation('status', PROJECT_STATUSES),
  
  dateValidation('start_date'),
  
  dateValidation('deadline'),
  
  validate
];

export const updateProjectValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project name cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Project name must not exceed 255 characters'),
  
  body('description')
    .optional()
    .trim(),
  
  body('goal')
    .optional()
    .trim(),
  
  enumValidation('status', PROJECT_STATUSES),
  
  dateValidation('start_date'),
  
  dateValidation('deadline'),
  
  body('github_repo_url')
    .optional({ nullable: true })
    .isString().withMessage('Repository URL must be text')
    .bail().trim()
    .isLength({ max: 500 }).withMessage('Repository URL must not exceed 500 characters')
    .custom(value => {
      if (!value) return true;
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'github.com' &&
        !url.username && !url.password && /^\/[^/]+\/[^/]+\/?$/.test(url.pathname);
    }).withMessage('Enter a valid HTTPS GitHub repository URL'),

  validate
];
