import { exchangeCodeStore } from '../utils/exchangeCodeStore.js';
import { userRepository } from '../repositories/userRepository.js';
import { generateToken } from '../utils/jwt.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';

/**
 * Exchange Controller
 * Handles secure exchange of short-lived codes for JWT tokens
 */

/**
 * POST /api/auth/google/exchange
 * Exchange a one-time code for a JWT token
 * 
 * @param {object} req.body - { code: string }
 * @returns {object} { success: true, token: string, user: object }
 */
export const exchangeCodeForToken = asyncHandler(async (req, res) => {
  console.log('[Exchange] Exchange endpoint called');
  
  const { code } = req.body;

  if (!code) {
    console.log('[Exchange] ERROR: No code provided in request body');
    throw new AppError('Exchange code is required', 400);
  }

  console.log('[Exchange] Code received (length:', code.length, ')');

  // Consume the exchange code (validates, marks as used, deletes)
  const userId = exchangeCodeStore.consume(code);

  if (!userId) {
    console.log('[Exchange] ERROR: Invalid or expired exchange code');
    throw new AppError('Invalid or expired exchange code', 401);
  }

  console.log('[Exchange] Exchange code validated, userId:', userId);

  // Get user data
  const user = await userRepository.findById(userId);
  
  if (!user) {
    console.log('[Exchange] ERROR: User not found for userId:', userId);
    throw new AppError('User not found', 404);
  }

  console.log('[Exchange] User found:', {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role
  });

  // Generate JWT token (same as email/password login)
  const token = generateToken(user.id);
  console.log('[Exchange] JWT token generated successfully');

  // Return response matching existing login format
  successResponse(res, {
    token,
    user
  }, 'Authentication successful');
  
  console.log('[Exchange] Response sent successfully');
});
