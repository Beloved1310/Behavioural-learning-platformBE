import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', AuthController.registerValidation, AuthController.register);
router.post('/login', AuthController.loginValidation, AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/forgot-password', AuthController.forgotPasswordValidation, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPasswordValidation, AuthController.resetPassword);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);

export default router;