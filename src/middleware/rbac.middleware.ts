import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export type UserRole = 'TECHNICIAN' | 'LEAD_TECHNICIAN' | 'SUPERVISOR' | 'PAYMENT_CLERK';

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required before checking permissions.',
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Role '${user.role}' is not authorized. Requires: ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    next();
  };
}
