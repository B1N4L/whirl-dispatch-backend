import { Router } from 'express';
import { login, register, getProfile } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/register', register);
authRouter.get('/me', authenticateToken, getProfile);
