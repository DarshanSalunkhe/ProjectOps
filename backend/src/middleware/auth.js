import { verifyToken, isSessionRevoked } from '../utils/jwt.js';
import { userRepository } from '../repositories/userRepository.js';
import { AppError } from './errorHandler.js';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Check if session is revoked (for JWTs with jti)
    if (decoded.jti) {
      const revoked = await isSessionRevoked(decoded.jti);
      if (revoked) {
        throw new AppError('Session has been revoked', 401);
      }
    }

    // Get user from database (provides fresh role/email)
    const user = await userRepository.findById(decoded.userId);
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
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

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
