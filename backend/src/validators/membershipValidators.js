import { body, param } from 'express-validator';
import { validate } from './common.js';

const INVITATION_ROLES = ['DEVELOPER', 'VIEWER'];
const MEMBER_ROLES = ['DEVELOPER', 'VIEWER']; // Cannot change to/from OWNER

/**
 * Validation for inviting a member
 */
export const inviteMemberValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('role')
    .isIn(INVITATION_ROLES)
    .withMessage(`Role must be one of: ${INVITATION_ROLES.join(', ')}`),
  
  validate
];

/**
 * Validation for changing member role
 */
export const changeMemberRoleValidation = [
  param('membershipId')
    .isInt({ min: 1 })
    .withMessage('Membership ID must be a positive integer'),
  
  body('role')
    .isIn(MEMBER_ROLES)
    .withMessage(`Role must be one of: ${MEMBER_ROLES.join(', ')}`),
  
  validate
];

/**
 * Validation for removing member
 */
export const removeMemberValidation = [
  param('membershipId')
    .isInt({ min: 1 })
    .withMessage('Membership ID must be a positive integer'),
  
  validate
];

/**
 * Validation for project ID parameter
 */
export const projectIdValidation = [
  param('projectId')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer'),
  
  validate
];

/**
 * Validation for invitation token parameter
 */
export const invitationTokenValidation = [
  param('token')
    .isLength({ min: 64, max: 64 })
    .isHexadecimal()
    .withMessage('Invalid invitation token'),
  
  validate
];
