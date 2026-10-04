import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../validators/authValidators.js';
import { authenticate } from '../middleware/auth.js';
import { initiateGoogleAuth, handleGoogleCallback } from '../controllers/googleAuthController.js';
import { exchangeCodeForToken } from '../controllers/exchangeController.js';

const router = express.Router();

// Traditional email/password authentication
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticate, getCurrentUser);

// Google OAuth 2.0 authentication
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);

// Exchange code for JWT token (secure OAuth completion)
router.post('/google/exchange', exchangeCodeForToken);

export default router;
