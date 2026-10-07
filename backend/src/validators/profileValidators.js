import { body } from 'express-validator';
import { validate } from './common.js';

export const updateProfileValidation = [
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  
  body('profile_photo_url')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2048 })
    .withMessage('Profile photo URL must be less than 2048 characters'),
  
  body('bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters'),
  
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('skills.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each skill must be between 1 and 50 characters'),
  
  body('experience_level')
    .optional()
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
    .withMessage('Experience level must be BEGINNER, INTERMEDIATE, ADVANCED, or EXPERT'),
  
  body('availability_status')
    .optional()
    .isIn(['AVAILABLE', 'BUSY', 'AWAY', 'OFFLINE'])
    .withMessage('Availability status must be AVAILABLE, BUSY, AWAY, or OFFLINE'),
  
  body('weekly_capacity_hours')
    .optional()
    .isInt({ min: 0, max: 168 })
    .withMessage('Weekly capacity must be between 0 and 168 hours'),
  
  validate // Add validation result checker
];
