import * as decisionService from '../services/decisionService.js';
import { getOrCreateDemoDecision } from '../services/demoService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const handleListDecisions = async (req, res, next) => {
  try {
    const result = await decisionService.listDecisions(req.user.id);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const handleCreateDecision = async (req, res, next) => {
  try {
    const result = await decisionService.createDecision(req.body, req.user.id);
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const handleCreateOrGetDemoDecision = async (req, res, next) => {
  try {
    const result = await getOrCreateDemoDecision(req.user.id, {
      reset: req.query.reset === 'true' || req.body?.reset === true
    });
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const handleGetDecisionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await decisionService.getDecisionById(id, req.user.id);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await decisionService.deleteDecision(id, req.user.id);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await decisionService.updateDecision(id, req.body, req.user.id);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const handleAnalyzeDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await decisionService.analyzeDecision(id, req.body, req.user.id);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const handleChatDecision = async (req, res, next) => {
  try {
    const { message, conversationHistory = [], searchWeb = false } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    const result = await decisionService.chatDecision({
      message: message.trim(),
      conversationHistory,
      searchWeb: Boolean(searchWeb),
      userId: req.user?.id || null
    });
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};


