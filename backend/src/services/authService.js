import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/userRepository.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';

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

    // Create user
    const user = await userRepository.create(name, email, passwordHash);

    // Generate token
    const token = generateToken(user.id);

    return {
      user,
      token
    };
  },

  async login(email, password) {
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

    // Generate token
    const token = generateToken(user.id);

    // Remove password hash from response
    delete user.password_hash;

    return {
      user,
      token
    };
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

    // Create new Google user with default MEMBER role
    // Never let OAuth profile determine admin/privileged roles
    user = await userRepository.createGoogleUser(googleId, name, email, 'MEMBER');

    return user;
  }
};
