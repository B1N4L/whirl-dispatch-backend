import { Router } from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  getLiveWidgetTelemetry,
} from '../controllers/notifications.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export const notificationsRouter = Router();

// Push notification queue endpoints
notificationsRouter.get('/', authenticateToken, getUserNotifications);
notificationsRouter.patch('/:id/read', authenticateToken, markNotificationAsRead);

// iOS WidgetKit telemetry feed
export const telemetryRouter = Router();
telemetryRouter.get('/widget/:technicianId', getLiveWidgetTelemetry);
