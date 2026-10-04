import { body, param, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Middleware to check validation results
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

/**
 * Common validation rules
 */
export const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

export const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please provide a valid email address');

export const passwordValidation = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters long');

export const nameValidation = body('name')
  .trim()
  .notEmpty()
  .withMessage('Name is required')
  .isLength({ max: 255 })
  .withMessage('Name must not exceed 255 characters');

export const dateValidation = (field) => 
  body(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} must be a valid date`);

export const enumValidation = (field, allowedValues) =>
  body(field)
    .optional()
    .isIn(allowedValues)
    .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);
