import { verifyToken, isSessionRevoked } from '../utils/jwt.js';
import { userRepository } from '../repositories/userRepository.js';
import { AppError } from './errorHandler.js';
import { isDatabaseConnectionError } from '../config/database.js';

export const createAuthenticate = ({
  verifyToken: verify = verifyToken,
  isSessionRevoked: checkRevoked = isSessionRevoked,
  userRepository: users = userRepository,
  isDatabaseConnectionError: isDbUnavailable = isDatabaseConnectionError
} = {}) => async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = verify(token);
    if (!decoded) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Check if session is revoked (for JWTs with jti)
    if (decoded.jti) {
      const revoked = await checkRevoked(decoded.jti);
      if (revoked) {
        throw new AppError('Session has been revoked', 401);
      }
    }

    // Always use fresh account and role state. An unavailable identity store
    // cannot safely validate revocation or current privileges.
    const user = await users.findById(decoded.userId);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Attach user to request
    req.user = user;
    req.tokenJti = decoded.jti; // Store jti for logout
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (isDbUnavailable(error)) {
      next(new AppError('Authentication service temporarily unavailable', 503));
    } else {
      next(error);
    }
  }
};

export const authenticate = createAuthenticate();

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};
