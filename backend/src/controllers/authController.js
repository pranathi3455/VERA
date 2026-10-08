import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const handleRegister = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const handleLogin = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const handleGoogleLogin = async (req, res, next) => {
  try {
    const result = await authService.loginWithGoogle(req.body);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const handleGetMe = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const result = await authService.getCurrentUser(userId);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const handleSendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.sendOtp(email);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const handleVerifyOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyOtp(email, code);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};
