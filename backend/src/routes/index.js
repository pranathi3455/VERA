import { Router } from 'express';
import authRoutes from './authRoutes.js';
import decisionRoutes from './decisionRoutes.js';
import evidenceRoutes from './evidenceRoutes.js';
import { checkDatabaseHealth } from '../services/supabaseClient.js';
import { AppError } from '../utils/appError.js';

const router = Router();

// Health Check Endpoint (Includes graceful Database Status)
router.get('/health', async (req, res, next) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    res.status(200).json({
      success: true,
      message: 'VERA API is running',
      database: dbHealth
    });
  } catch (err) {
    next(err);
  }
});

// Dedicated Database Health Probe Endpoint
router.get('/health/db', async (req, res, next) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    res.status(dbHealth.connected ? 200 : 503).json({
      success: dbHealth.connected,
      data: dbHealth
    });
  } catch (err) {
    next(err);
  }
});

// Domain Routes
router.use('/auth', authRoutes);
router.use('/decisions', decisionRoutes);
router.use('/evidence', evidenceRoutes);

// Catch-all 404 for undefined API routes
router.all('*', (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found`, 404, 'ROUTE_NOT_FOUND'));
});

export default router;
