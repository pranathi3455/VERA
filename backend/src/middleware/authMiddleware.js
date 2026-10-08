import { verifyToken } from '../utils/token.js';
import { AppError } from '../utils/appError.js';

/**
 * Authentication Middleware
 * Enforces verified JWT token on protected endpoints.
 * Sets req.user = { id, email } from verified JWT payload.
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.trim() === '') {
    return next(new AppError('Invalid token format.', 401, 'INVALID_TOKEN'));
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return next(new AppError('Invalid authentication token payload.', 401, 'INVALID_TOKEN'));
    }

    // Attach verified user identity from token (Never trust client-supplied user IDs)
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Authentication token verification failed.', 401, 'INVALID_TOKEN'));
  }
};

/**
 * Optional Auth Middleware
 * Decodes token if present, but does not reject request if unauthenticated.
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        req.user = {
          id: decoded.id,
          email: decoded.email
        };
      }
    } catch {
      // Ignore token decode errors for optional auth
    }
  }
  next();
};
