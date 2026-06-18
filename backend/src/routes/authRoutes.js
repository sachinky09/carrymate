import express from 'express';
import {
  registerStart,
  verifyEmailOtp,
  verifySmsOtp,
  login,
  googleLogin,
  logout
} from '../controllers/authController.js';
import { otpLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register/start', otpLimiter, registerStart);
router.post('/register/verify-email', verifyEmailOtp);
router.post('/register/verify-phone', verifySmsOtp);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/logout', logout);

export default router;
