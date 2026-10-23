import { Request, Response } from 'express';
import { db } from '../config/db';
import {
  systemNotifications,
  workOrders,
  siteAttendance,
  users,
} from '../db/schema/index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { eq, desc, and, isNull } from 'drizzle-orm';

export async function getUserNotifications(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const notifications = await db.query.systemNotifications.findMany({
      where: eq(systemNotifications.recipientUserId, authUser.userId),
      orderBy: [desc(systemNotifications.createdAt)],
      limit: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      recipientUserId: authUser.userId,
      unreadCount,
      totalCount: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('[NOTIFICATIONS ERROR] Fetch notifications failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve user notifications.',
    });
  }
}

export async function markNotificationAsRead(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const id = req.params.id as string;

    const notification = await db.query.systemNotifications.findFirst({
      where: and(
        eq(systemNotifications.id, id),
        eq(systemNotifications.recipientUserId, authUser.userId)
      ),
    });

    if (!notification) {
      res.status(404).json({ error: 'NotFound', message: 'Notification not found.' });
      return;
    }

    const [updated] = await db
      .update(systemNotifications)
      .set({ isRead: true })
      .where(eq(systemNotifications.id, id))
      .returning();

    res.status(200).json({
      message: 'Notification marked as read.',
      notification: updated,
    });
  } catch (error) {
    console.error('[NOTIFICATIONS ERROR] Mark as read failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update notification status.',
    });
  }
}

export async function getLiveWidgetTelemetry(req: Request, res: Response): Promise<void> {
  try {
    const technicianId = req.params.technicianId as string;

    const technician = await db.query.users.findFirst({
      where: eq(users.id, technicianId),
    });

    if (!technician) {
      res.status(404).json({ error: 'NotFound', message: 'Technician not found.' });
      return;
    }

    // 1. Fetch active attendance session
    const activeSession = await db.query.siteAttendance.findFirst({
      where: and(
        eq(siteAttendance.technicianId, technicianId),
        isNull(siteAttendance.clockOutTimestamp)
      ),
      with: {
        workOrder: {
          with: { facility: true },
        },
      },
      orderBy: [desc(siteAttendance.createdAt)],
    });

    if (activeSession && activeSession.workOrder) {
      const now = new Date();
      const elapsedSeconds = Math.max(
        0,
        Math.floor((now.getTime() - activeSession.clockInTimestamp.getTime()) / 1000)
      );
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);

      const isBreach = activeSession.sessionStatus === 'ON_BREAK_VIOLATION';
      const facilityName = activeSession.workOrder.facility.facilityName;

      res.status(200).json({
        technicianId,
        technicianName: technician.fullName,
        hasActiveShift: true,
        shiftStatus: activeSession.sessionStatus,
        activeWorkOrder: {
          id: activeSession.workOrder.id,
          title: activeSession.workOrder.title,
          priority: activeSession.workOrder.priority,
          facilityName,
          address: activeSession.workOrder.facility.address,
          scheduledStartTime: activeSession.workOrder.scheduledStartTime,
        },
        elapsedShiftMinutes: elapsedMinutes,
        widgetDisplay: {
          headline: isBreach ? 'BREACH ALERT' : `ON SITE: ${facilityName}`,
          subline: isBreach
            ? 'Geofence Exit • Shift Paused'
            : `Active Shift • ${elapsedMinutes} mins on site`,
          statusColorHex: isBreach ? '#FF3B30' : '#34C759',
          batteryFriendlyRefreshIntervalSeconds: 60,
        },
      });
      return;
    }

    // 2. Fallback: Check if assigned to an active dispatched work order
    const dispatchedJob = await db.query.workOrders.findFirst({
      where: eq(workOrders.leadTechnicianId, technicianId),
      with: { facility: true },
      orderBy: [desc(workOrders.createdAt)],
    });

    if (dispatchedJob && (dispatchedJob.status === 'EN_ROUTE' || dispatchedJob.status === 'DISPATCHED')) {
      const isEnRoute = dispatchedJob.status === 'EN_ROUTE';
      res.status(200).json({
        technicianId,
        technicianName: technician.fullName,
        hasActiveShift: true,
        shiftStatus: dispatchedJob.status,
        activeWorkOrder: {
          id: dispatchedJob.id,
          title: dispatchedJob.title,
          priority: dispatchedJob.priority,
          facilityName: dispatchedJob.facility.facilityName,
          address: dispatchedJob.facility.address,
          scheduledStartTime: dispatchedJob.scheduledStartTime,
        },
        elapsedShiftMinutes: 0,
        widgetDisplay: {
          headline: isEnRoute ? 'EN ROUTE TO SITE' : 'JOB DISPATCHED',
          subline: dispatchedJob.facility.facilityName,
          statusColorHex: '#007AFF',
          batteryFriendlyRefreshIntervalSeconds: 120,
        },
      });
      return;
    }

    // 3. Off-shift state
    res.status(200).json({
      technicianId,
      technicianName: technician.fullName,
      hasActiveShift: false,
      shiftStatus: 'OFFLINE',
      activeWorkOrder: null,
      elapsedShiftMinutes: 0,
      widgetDisplay: {
        headline: 'OFF SHIFT',
        subline: 'No active dispatches',
        statusColorHex: '#8E8E93',
        batteryFriendlyRefreshIntervalSeconds: 300,
      },
    });
  } catch (error) {
    console.error('[WIDGET TELEMETRY ERROR] Fetch telemetry failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve WidgetKit shift telemetry.',
    });
  }
}
