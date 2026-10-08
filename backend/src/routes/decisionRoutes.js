import { Router } from 'express';
import * as decisionController from '../controllers/decisionController.js';
import * as evidenceController from '../controllers/evidenceController.js';
import { validate } from '../middleware/validate.js';
import { createDecisionSchema, analyzeDecisionSchema } from '../validators/decisionValidators.js';
import { createEvidenceSchema } from '../validators/evidenceValidators.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Decision Intelligence Conversational Chat (accessible freely with optional auth)
router.post('/chat', optionalAuth, decisionController.handleChatDecision);

// Enforce authentication on all other protected /api/decisions routes
router.use(requireAuth);

// Decision CRUD and Analysis
router.get('/', decisionController.handleListDecisions);
router.post('/', validate(createDecisionSchema), decisionController.handleCreateDecision);
router.post('/demo', decisionController.handleCreateOrGetDemoDecision);
router.get('/:id', decisionController.handleGetDecisionById);
router.patch('/:id', decisionController.handleUpdateDecision);
router.put('/:id', decisionController.handleUpdateDecision);
router.delete('/:id', decisionController.handleDeleteDecision);
router.post('/:id/analyze', validate(analyzeDecisionSchema), decisionController.handleAnalyzeDecision);

// Nested Evidence routes
router.post('/:id/evidence', validate(createEvidenceSchema), evidenceController.handleAddEvidence);
router.get('/:id/evidence', evidenceController.handleListEvidence);

export default router;
