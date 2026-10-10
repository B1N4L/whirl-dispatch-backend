import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtUserPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token required in Authorization header.',
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid or expired access token.',
    });
    return;
  }

  (req as AuthenticatedRequest).user = payload;
  next();
}
