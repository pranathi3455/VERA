import { request } from '../utils/apiClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const evidenceService = {
  async addEvidence(decisionId, evidenceData, token) {
    return await request(`${API_BASE}/api/decisions/${decisionId}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(evidenceData)
    });
  },

  async getEvidence(decisionId, token) {
    return await request(`${API_BASE}/api/decisions/${decisionId}/evidence`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  async deleteEvidence(evidenceId, token) {
    return await request(`${API_BASE}/api/evidence/${evidenceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};
