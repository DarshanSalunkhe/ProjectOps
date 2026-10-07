import { body } from 'express-validator';
import { validate } from './common.js';

export const requestPasswordResetValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  
  validate
];

export const confirmPasswordResetValidation = [
  body('token')
    .isString()
    .trim()
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format'),
  
  body('newPassword')
    .isString()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  validate
];
