import { request } from '../utils/apiClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const decisionService = {
  async createDecision(decisionData, token) {
    return await request(`${API_BASE}/api/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(decisionData)
    });
  },

  async getDecisions(token) {
    return await request(`${API_BASE}/api/decisions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  async getDecisionById(id, token) {
    return await request(`${API_BASE}/api/decisions/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  async deleteDecision(id, token) {
    return await request(`${API_BASE}/api/decisions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  async updateDecision(id, updateData, token) {
    return await request(`${API_BASE}/api/decisions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
  },

  async analyzeDecision(id, payload = {}, token) {
    const body = payload.rawScores !== undefined || payload.forceAiRefresh !== undefined
      ? payload
      : { rawScores: payload };

    return await request(`${API_BASE}/api/decisions/${id}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
  },

  async getOrCreateDemoDecision(token, options = {}) {
    return await request(`${API_BASE}/api/decisions/demo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(options)
    });
  },

  async chatDecision(message, conversationHistory = [], token, options = {}) {
    return await request(`${API_BASE}/api/decisions/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message,
        conversationHistory,
        searchWeb: Boolean(options.searchWeb)
      })
    });
  }
};

