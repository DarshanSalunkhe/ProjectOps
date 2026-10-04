import { authService } from '../services/authService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const result = await authService.register(name, email, password);

  successResponse(res, result, 'Registration successful', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  successResponse(res, result, 'Login successful');
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  successResponse(res, user, 'User retrieved successfully');
});
