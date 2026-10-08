import { AppError } from '../utils/appError.js';

// Sensitive patterns that must never reach client responses
const SENSITIVE_PATTERNS = [
  /password_hash/i,
  /supabase/i,
  /postgres/i,
  /pg_/i,
  /pgrst/i,
  /relation ".*" does not exist/i,
  /syntax error at or near/i,
  /violates foreign key/i,
  /violates unique constraint/i,
  /api_key=[A-Za-z0-9-_]+/i,
  /Bearer\s+[A-Za-z0-9-_]{25,}/i,
  /eyJ[A-Za-z0-9-_]{25,}/i
];

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // 1. JSON parsing syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON in request body.';
  }

  // 2. JWT errors
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication session has expired. Please sign in again.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Authentication token is invalid. Please sign in again.';
  }

  // 3. PostgreSQL UUID invalid syntax error (e.g. invalid decision ID)
  if (typeof message === 'string' && message.includes('invalid input syntax for type uuid')) {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'The requested resource could not be found.';
  }

  // 4. Sanitize internal / database error messages
  if (code === 'DB_ERROR' || statusCode >= 500) {
    // Log real error on server for debugging without crashing
    console.error(`[Server Error] [${code}] ${statusCode}:`, err.message);

    // Provide safe, professional client response
    message = 'A database or service operation could not be completed. Please try again later.';
    code = 'SERVICE_UNAVAILABLE';
    details = null; // Prevent leaking internal DB details
  }

  // 5. General sensitivity filter on message
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      message = 'An unexpected system error occurred. Please contact support if the issue persists.';
      if (statusCode >= 500) {
        code = 'INTERNAL_ERROR';
      }
      details = null;
      break;
    }
  }

  // Ensure details array doesn't leak sensitive field names or internal values
  if (details && Array.isArray(details)) {
    details = details.map((d) => {
      if (typeof d === 'object' && d !== null) {
        return {
          field: d.field || undefined,
          message: d.message || 'Invalid value'
        };
      }
      return d;
    });
  }

  const errorResponse = {
    message,
    code
  };

  if (details) {
    errorResponse.details = details;
  }

  res.status(statusCode).json({
    success: false,
    error: errorResponse
  });
};
