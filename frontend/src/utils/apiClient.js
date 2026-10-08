/**
 * Centralized API Client Wrapper for VERA
 * 
 * Provides safe network calls, auto-dispatch of expired session events,
 * and professional error message resolution.
 */
import { formatUserErrorMessage } from './errorHandler';

export async function request(url, options = {}) {
  try {
    const res = await fetch(url, options);

    let data = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      // 1. Session Expired (401)
      if (res.status === 401) {
        if (options.headers?.Authorization || options.headers?.authorization) {
          window.dispatchEvent(
            new CustomEvent('vera:session-expired', {
              detail: { message: 'Your session has expired. Please sign in again.' }
            })
          );
        }
        const errorMsg = data?.error?.message || 'Your session has expired. Please sign in again.';
        throw new Error(formatUserErrorMessage(errorMsg));
      }

      // 2. Forbidden (403)
      if (res.status === 403) {
        const errorMsg = data?.error?.message || 'You do not have permission to perform this action.';
        throw new Error(formatUserErrorMessage(errorMsg));
      }

      // 3. Not Found (404)
      if (res.status === 404) {
        const errorMsg = data?.error?.message || 'The requested resource could not be found.';
        throw new Error(formatUserErrorMessage(errorMsg));
      }

      // 4. Server or Database Error (500+)
      if (res.status >= 500) {
        throw new Error('VERA services are temporarily experiencing technical difficulties. Please try again shortly.');
      }

      // 5. Validation or Client Error (400)
      const errorMsg = data?.error?.message || 'The operation could not be completed with the provided data.';
      throw new Error(formatUserErrorMessage(errorMsg));
    }

    return data?.data !== undefined ? data.data : data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error('Unable to connect to VERA service. Please check your network connection.');
    }
    throw new Error(formatUserErrorMessage(err.message));
  }
}

export default {
  request
};
