import { body } from 'express-validator';
import { validate, emailValidation, passwordValidation, nameValidation } from './common.js';

export const registerValidation = [
  nameValidation,
  emailValidation,
  passwordValidation,
  validate
];

export const loginValidation = [
  emailValidation,
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];
