import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.handleRegister);
router.post('/login', validate(loginSchema), authController.handleLogin);
router.post('/google', authController.handleGoogleLogin);
router.post('/otp/send', authController.handleSendOtp);
router.post('/otp/verify', authController.handleVerifyOtp);
router.get('/me', requireAuth, authController.handleGetMe);

export default router;
