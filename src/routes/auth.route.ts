import { Router } from 'express';
import { login, register, getProfile } from '../controllers/auth.controller';
import { biometricVerify } from '../controllers/biometric.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/register', register);
authRouter.get('/me', authenticateToken, getProfile);
authRouter.post('/biometric-verify', authenticateToken, biometricVerify);

// Protected supervisor check endpoint to test RBAC enforcement
authRouter.get('/supervisor-check', authenticateToken, requireRole(['SUPERVISOR']), (_req, res) => {
  res.status(200).json({ authorized: true, role: 'SUPERVISOR' });
});
