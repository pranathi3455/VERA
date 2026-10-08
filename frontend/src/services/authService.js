import { request } from '../utils/apiClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const authService = {
  async register(name, email, password) {
    return await request(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
  },

  async login(email, password) {
    return await request(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
  },

  async loginWithGoogle(profile = {}) {
    return await request(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile)
    });
  },

  async getMe(token) {
    const data = await request(`${API_BASE}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return data?.user || data;
  },

  async sendOtp(email) {
    return await request(`${API_BASE}/api/auth/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
  },

  async verifyOtp(email, code) {
    return await request(`${API_BASE}/api/auth/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, code })
    });
  }
};
