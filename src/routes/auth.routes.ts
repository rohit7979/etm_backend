import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate';
import {
  loginSchema,
  acceptInviteSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Standard Auth
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.getMe);
router.post('/logout', AuthController.logout);

// Admin Invite Flow
router.get('/invite/:token', AuthController.verifyInviteToken);
router.post('/invite/:token/accept', validateRequest(acceptInviteSchema), AuthController.acceptInvite);

// Forgot / Reset Password Flow
router.post('/forgot-password', validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.get('/reset-password/:token', AuthController.verifyResetToken);
router.post('/reset-password/:token', validateRequest(resetPasswordSchema), AuthController.resetPassword);

export default router;
