import { body, param } from 'express-validator';
import { validate } from './common.js';

export const updateUserRoleValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),
  
  body('role')
    .isIn(['SYSTEM_ADMIN', 'PROJECT_OWNER', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'VIEWER'])
    .withMessage('Invalid role. Must be SYSTEM_ADMIN, PROJECT_OWNER, PROJECT_MANAGER, TEAM_MEMBER, or VIEWER'),
  
  validate // Add validation result checker
];
