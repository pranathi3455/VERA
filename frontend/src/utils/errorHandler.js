/**
 * Centralized Frontend Error Handler for VERA
 * 
 * Ensures that technical errors such as:
 * - "undefined"
 * - "500"
 * - "AxiosError"
 * - "Failed to fetch"
 * - "[object Object]"
 * - SQL / Postgres error strings
 * are never directly displayed to users.
 */

const TECHNICAL_PATTERNS = [
  { pattern: /failed to fetch|network\s?error|err_connection_refused|load failed/i, message: 'Unable to connect to VERA service. Please check your network connection.' },
  { pattern: /token expired|jwt expired|token_expired|session expired/i, message: 'Your session has expired. Please sign in again.' },
  { pattern: /unauthorized|invalid_token|invalid token/i, message: 'Authentication required. Please sign in to continue.' },
  { pattern: /forbidden|permission denied/i, message: 'You do not have permission to access or modify this resource.' },
  { pattern: /not found|not_found|does not exist/i, message: 'The requested decision framework could not be found.' },
  { pattern: /internal server error|500|502|503|service_unavailable|db_error|database/i, message: 'VERA services are temporarily experiencing technical difficulties. Please try again shortly.' },
  { pattern: /cannot read properties|is not a function|undefined|null|\[object object\]/i, message: 'An unexpected display error occurred. Please refresh the page.' },
  { pattern: /axioserror/i, message: 'Communication with the server failed. Please verify your connection.' }
];

/**
 * Formats any raw error into a clean, professional user-facing sentence.
 */
export function formatUserErrorMessage(err, defaultFallback = 'An unexpected error occurred. Please try again.') {
  if (!err) return defaultFallback;

  let rawMessage = '';
  if (typeof err === 'string') {
    rawMessage = err;
  } else if (err.message && typeof err.message === 'string') {
    rawMessage = err.message;
  } else if (err.error?.message) {
    rawMessage = err.error.message;
  } else {
    rawMessage = String(err);
  }

  const trimmed = rawMessage.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed === '[object Object]') {
    return defaultFallback;
  }

  // Check against known technical patterns
  for (const { pattern, message } of TECHNICAL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return message;
    }
  }

  // If the message is already a clean user-facing sentence (ends with punctuation or has spaces)
  // Ensure it doesn't contain raw HTTP codes
  if (/^\d{3}$/.test(trimmed)) {
    return 'The server encountered an error processing your request.';
  }

  return trimmed;
}

export default {
  formatUserErrorMessage
};
