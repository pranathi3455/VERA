import { Router } from 'express';
import * as evidenceController from '../controllers/evidenceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Enforce authentication on all /api/evidence routes
router.use(requireAuth);

// Evidence direct routes
router.delete('/:id', evidenceController.handleDeleteEvidence);

export default router;
