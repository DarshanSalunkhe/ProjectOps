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
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip;

  const result = await authService.login(email, password, userAgent, ipAddress);

  successResponse(res, result, 'Login successful');
});

export const logout = asyncHandler(async (req, res) => {
  const jti = req.tokenJti;

  const result = await authService.logout(jti);

  successResponse(res, result, 'Logout successful');
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  successResponse(res, user, 'User retrieved successfully');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;

  const user = await authService.updateProfile(userId, updates);

  successResponse(res, user, 'Profile updated successfully');
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await authService.requestPasswordReset(email);

  successResponse(res, result, 'Password reset request processed');
});

export const confirmPasswordReset = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const result = await authService.confirmPasswordReset(token, newPassword);

  successResponse(res, result, 'Password reset successful');
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await authService.getAllUsers();

  successResponse(res, users, 'Users retrieved successfully');
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const adminUserId = req.user.id;
  const targetUserId = parseInt(req.params.userId, 10);
  const { role } = req.body;

  const result = await authService.updateUserRole(adminUserId, targetUserId, role);

  successResponse(res, result, 'User role updated successfully');
});
