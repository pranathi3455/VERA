/**
 * Standardized API Response Utilities for VERA
 */

export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

export const sendError = (res, message, code = 'INTERNAL_ERROR', statusCode = 500, details = null) => {
  const errorPayload = {
    message,
    code
  };

  if (details) {
    errorPayload.details = details;
  }

  return res.status(statusCode).json({
    success: false,
    error: errorPayload
  });
};
