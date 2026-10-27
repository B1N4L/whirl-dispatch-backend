import { Router } from 'express';
import { getTechnicians } from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export const usersRouter = Router();

usersRouter.use(authenticateToken);

usersRouter.get('/', getTechnicians);
usersRouter.get('/technicians', getTechnicians);
