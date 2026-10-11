import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';
import { generateToken, createSession, revokeSession, revokeAllUserSessions, getSessionExpiry } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import { query, getClient } from '../config/database.js';
import emailService from './emailService.js';
import config from '../config/index.js';

const SALT_ROUNDS = 10;

export const authService = {
  async register(name, email, password) {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with PROJECT_OWNER role
    const user = await userRepository.create(name, email, passwordHash, 'PROJECT_OWNER');

    // Generate token with jti
    const token = generateToken(user.id, true);
    const decoded = jwt.decode(token);

    // Create session
    await createSession(decoded.jti, user.id, getSessionExpiry());

    return {
      user,
      token
    };
  },

  async login(email, password, userAgent = null, ipAddress = null) {
    // Find user with password hash
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token with jti
    const token = generateToken(user.id, true);
    const decoded = jwt.decode(token);

    // Create session
    await createSession(decoded.jti, user.id, getSessionExpiry(), userAgent, ipAddress);

    // Remove password hash from response
    delete user.password_hash;

    return {
      user,
      token
    };
  },

  async logout(jti) {
    if (!jti) {
      throw new AppError('Cannot revoke session for old JWT format', 400);
    }

    await revokeSession(jti);
    return { message: 'Logged out successfully' };
  },

  async updateProfile(userId, updates) {
    // Prevent workload_hours from being updated by users
    if (updates.workload_hours !== undefined) {
      delete updates.workload_hours;
    }

    try {
      const updatedUser = await userRepository.updateProfile(userId, updates);
      if (!updatedUser) {
        throw new AppError('No valid fields to update', 400);
      }
      return updatedUser;
    } catch (error) {
      // Check for unique constraint violation on email
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        throw new AppError('Email already in use', 409);
      }
      throw error;
    }
  },

  async requestPasswordReset(email) {
    try {
      // Find user by email
      const user = await userRepository.findByEmail(email);

      if (!user) {
        // Return generic message for security
        return { message: 'If that email is registered, a reset link has been sent' };
      }

      // Generate secure random token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Store hashed token
      await query(`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '30 minutes')
        ON CONFLICT (user_id)
        DO UPDATE SET
          token_hash = EXCLUDED.token_hash,
          expires_at = EXCLUDED.expires_at,
          used_at = NULL,
          created_at = NOW()
      `, [user.id, tokenHash]);

      // Create reset link
      const resetLink = `${config.frontendUrl}/reset-password?token=${rawToken}`;

      // Try to send email (don't fail if email service unavailable)
      try {
        await emailService.sendPasswordResetEmail(user.email, resetLink, user.name);
      } catch (emailError) {
        console.error('Password reset email failed:', emailError.message);
      }

      return { message: 'If that email is registered, a reset link has been sent' };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { message: 'If that email is registered, a reset link has been sent' };
    }
  },

  async confirmPasswordReset(rawToken, newPassword) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Begin transaction
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Lock and fetch reset token
      const result = await client.query(`
        SELECT id, user_id, expires_at, used_at
        FROM password_reset_tokens
        WHERE token_hash = $1
        FOR UPDATE
      `, [tokenHash]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError('Invalid or expired reset token', 400);
      }

      const resetToken = result.rows[0];

      // Verify token is valid
      if (resetToken.used_at) {
        await client.query('ROLLBACK');
        throw new AppError('This reset link has already been used', 400);
      }

      if (new Date() > new Date(resetToken.expires_at)) {
        await client.query('ROLLBACK');
        throw new AppError('This reset link has expired', 400);
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update password
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, resetToken.user_id]
      );

      // Mark token as used
      await client.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
        [resetToken.id]
      );

      // Revoke all active sessions
      await client.query(
        'UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
        [resetToken.user_id]
      );

      await client.query('COMMIT');

      return { message: 'Password reset successful. Please log in with your new password.' };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async changePassword(userId, currentPassword, newPassword) {
    const userWithHash = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (!userWithHash.rows[0]) throw new AppError('User not found', 404);

    const isValid = await bcrypt.compare(currentPassword, userWithHash.rows[0].password_hash);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);
    return { message: 'Password changed successfully' };
  },

  async getAllUsers() {
    return await userRepository.getAll();
  },

  /**
   * Get workspace members - respects profile_visibility
   * Public profiles visible to all; private profiles hidden unless it's the requester
   */
  async getWorkspaceMembers(requestingUserId = null) {
    return await userRepository.findAll(requestingUserId);
  },

  async updateUserRole(adminUserId, targetUserId, newRole) {
    // Cannot change own role
    if (adminUserId === targetUserId) {
      throw new AppError('Cannot change your own role', 400);
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    // If demoting a SYSTEM_ADMIN, check if they're the last one
    if (targetUser.role === 'SYSTEM_ADMIN' && newRole !== 'SYSTEM_ADMIN') {
      const adminCount = await query(
        'SELECT COUNT(*) FROM users WHERE role = $1',
        ['SYSTEM_ADMIN']
      );

      if (parseInt(adminCount.rows[0].count) <= 1) {
        throw new AppError('Cannot demote the last SYSTEM_ADMIN. Promote another user first.', 400);
      }
    }

    const validRoles = ['SYSTEM_ADMIN', 'PROJECT_OWNER', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'VIEWER'];
    if (!validRoles.includes(newRole)) {
      throw new AppError('Invalid role', 400);
    }

    await userRepository.updateRole(targetUserId, newRole);
    return { message: 'Role updated successfully' };
  },

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  },

  /**
   * Find or create a user from Google OAuth profile
   * Security: Blocks auto-linking if email already exists with password
   * @param {object} googleProfile - { googleId, email, name }
   * @returns {object} User object
   */
  async findOrCreateGoogleUser(googleProfile) {
    const { googleId, email, name } = googleProfile;

    // First, check if user exists with this Google ID
    let user = await userRepository.findByGoogleId(googleId);

    if (user) {
      return user;
    }

    // Check if email already exists with a password (existing password account)
    const existingPasswordUser = await userRepository.findByEmail(email);

    if (existingPasswordUser && existingPasswordUser.password_hash) {
      // SECURITY: Do NOT auto-link Google to existing password account
      // This prevents Google account takeover attacks
      throw new AppError(
        'An account with this email already exists. Please sign in with your password.',
        409
      );
    }

    // Create new Google user with PROJECT_OWNER role
    user = await userRepository.createGoogleUser(googleId, name, email, 'PROJECT_OWNER');

    return user;
  }
};
