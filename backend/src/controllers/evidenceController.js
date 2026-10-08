import * as evidenceService from '../services/evidenceService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const handleAddEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await evidenceService.attachEvidence(id, req.body, req.user.id);
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const handleListEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await evidenceService.listEvidenceByDecision(id, req.user.id);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await evidenceService.deleteEvidence(id, req.user.id);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};
