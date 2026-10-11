import express from 'express';
import {
  register,
  login,
  logout,
  changePassword,
  getCurrentUser,
  updateProfile,
  requestPasswordReset,
  confirmPasswordReset,
  getAllUsers,
  updateUserRole,
  getWorkspaceMembers
} from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../validators/authValidators.js';
import { updateProfileValidation } from '../validators/profileValidators.js';
import { requestPasswordResetValidation, confirmPasswordResetValidation } from '../validators/passwordResetValidators.js';
import { updateUserRoleValidation } from '../validators/adminValidators.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { initiateGoogleAuth, handleGoogleCallback } from '../controllers/googleAuthController.js';
import { exchangeCodeForToken } from '../controllers/exchangeController.js';

const router = express.Router();

// Traditional email/password authentication
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', authenticate, logout);

// User profile
router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, updateProfileValidation, updateProfile);

// Password reset
router.post('/password-reset/request', requestPasswordResetValidation, requestPasswordReset);
router.post('/password-reset/confirm', confirmPasswordResetValidation, confirmPasswordReset);
router.post('/change-password', authenticate, changePassword);

// Workspace members (all authenticated users can see)
router.get('/workspace/members', authenticate, getWorkspaceMembers);

// Admin endpoints
router.get('/users', authenticate, authorize('SYSTEM_ADMIN'), getAllUsers);
router.patch('/users/:userId/role', authenticate, authorize('SYSTEM_ADMIN'), updateUserRoleValidation, updateUserRole);

// Google OAuth 2.0 authentication
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);

// Exchange code for JWT token (secure OAuth completion)
router.post('/google/exchange', exchangeCodeForToken);

export default router;
