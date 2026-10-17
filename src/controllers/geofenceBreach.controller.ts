import { Request, Response } from 'express';
import { db } from '../config/db';
import {
  siteAttendance,
  geofenceAuditLogs,
  workOrders,
  systemNotifications,
} from '../db/schema/index';
import { boundaryEventSchema, resumeShiftSchema } from '../schemas/attendance.schema';
import { isInsideGeofence } from '../utils/haversine';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { eq, and, desc } from 'drizzle-orm';

export async function handleBoundaryEvent(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const parseResult = boundaryEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { workOrderId, eventType, latitude, longitude, accuracyMeters, notes } = parseResult.data;

    // 1. Locate active attendance session
    const activeSession = await db.query.siteAttendance.findFirst({
      where: and(
        eq(siteAttendance.workOrderId, workOrderId),
        eq(siteAttendance.technicianId, authUser.userId),
        eq(siteAttendance.clockOutTimestamp, null as any)
      ),
      orderBy: [desc(siteAttendance.createdAt)],
    });

    if (!activeSession) {
      res.status(404).json({
        error: 'NotFound',
        message: 'No active attendance session found to log boundary event against.',
      });
      return;
    }

    const now = new Date();

    // 2. If boundary exit, transition session to ON_BREAK_VIOLATION & pause timer
    if (eventType === 'GEOFENCE_EXIT_BREACH') {
      await db
        .update(siteAttendance)
        .set({
          sessionStatus: 'ON_BREAK_VIOLATION',
          updatedAt: now,
        })
        .where(eq(siteAttendance.id, activeSession.id));

      // Fetch work order for notification context
      const workOrder = await db.query.workOrders.findFirst({
        where: eq(workOrders.id, workOrderId),
        with: { facility: true },
      });

      if (workOrder) {
        // Dispatch breach alerts to Supervisor and Lead Tech
        const alertRecipients = Array.from(
          new Set([workOrder.supervisorId, workOrder.leadTechnicianId])
        ).filter((id) => id !== authUser.userId);

        if (alertRecipients.length > 0) {
          const alerts = alertRecipients.map((recipientId) => ({
            recipientUserId: recipientId,
            workOrderId,
            notificationType: 'GEOFENCE_BREACH_ALERT' as const,
            title: 'Unauthorized Boundary Breach Alert',
            body: `Technician '${authUser.fullName}' triggered a geofence boundary breach at ${workOrder.facility.facilityName}. Billable shift timer paused.`,
          }));
          await db.insert(systemNotifications).values(alerts);
        }
      }
    }

    // 3. Log audit event
    const [auditLog] = await db
      .insert(geofenceAuditLogs)
      .values({
        workOrderId,
        technicianId: authUser.userId,
        siteAttendanceId: activeSession.id,
        eventType,
        recordedTimestamp: now,
        deviceLatitude: latitude,
        deviceLongitude: longitude,
        accuracyMeters,
        isTamperVerified: true,
        notes: notes || `Boundary event recorded: ${eventType}. Shift timer state updated.`,
      })
      .returning();

    res.status(200).json({
      message: `Boundary event '${eventType}' logged successfully.`,
      event: auditLog,
      sessionStatus: eventType === 'GEOFENCE_EXIT_BREACH' ? 'ON_BREAK_VIOLATION' : activeSession.sessionStatus,
    });
  } catch (error) {
    console.error('[GEOFENCE ERROR] Boundary event handling failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to process geofence boundary event.',
    });
  }
}

export async function resumeShift(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const parseResult = resumeShiftSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { workOrderId, latitude, longitude, accuracyMeters, biometricVerified } = parseResult.data;

    // 1. Fetch work order & facility location
    const workOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId),
      with: { facility: true },
    });

    if (!workOrder) {
      res.status(404).json({ error: 'NotFound', message: 'Work order not found.' });
      return;
    }

    // 2. Verify technician is back physically within the 100m geofence
    const geofenceCheck = isInsideGeofence(
      latitude,
      longitude,
      workOrder.facility.latitude,
      workOrder.facility.longitude,
      workOrder.facility.geofenceRadius,
      accuracyMeters
    );

    if (!geofenceCheck.isInside) {
      res.status(400).json({
        error: 'OutOfGeofence',
        message: `Cannot resume shift while outside facility perimeter. Distance: ${geofenceCheck.distanceMeters}m, Required: <= ${workOrder.facility.geofenceRadius}m.`,
        currentDistanceMeters: geofenceCheck.distanceMeters,
      });
      return;
    }

    // 3. Find breached session
    const session = await db.query.siteAttendance.findFirst({
      where: and(
        eq(siteAttendance.workOrderId, workOrderId),
        eq(siteAttendance.technicianId, authUser.userId),
        eq(siteAttendance.sessionStatus, 'ON_BREAK_VIOLATION')
      ),
      orderBy: [desc(siteAttendance.createdAt)],
    });

    if (!session) {
      res.status(404).json({
        error: 'NotFound',
        message: 'No paused or break-violated session found to resume.',
      });
      return;
    }

    // 4. Calculate break duration from last breach event
    const lastBreach = await db.query.geofenceAuditLogs.findFirst({
      where: and(
        eq(geofenceAuditLogs.siteAttendanceId, session.id),
        eq(geofenceAuditLogs.eventType, 'GEOFENCE_EXIT_BREACH')
      ),
      orderBy: [desc(geofenceAuditLogs.recordedTimestamp)],
    });

    const now = new Date();
    let additionalBreakSeconds = 0;
    if (lastBreach) {
      additionalBreakSeconds = Math.max(
        0,
        Math.floor((now.getTime() - lastBreach.recordedTimestamp.getTime()) / 1000)
      );
    }

    const updatedBreakTotal = (session.totalBreakSeconds || 0) + additionalBreakSeconds;

    // 5. Update session back to ACTIVE_ON_SITE
    const [resumedSession] = await db
      .update(siteAttendance)
      .set({
        sessionStatus: 'ACTIVE_ON_SITE',
        totalBreakSeconds: updatedBreakTotal,
        updatedAt: now,
      })
      .where(eq(siteAttendance.id, session.id))
      .returning();

    // 6. Log biometric re-auth resume event
    await db.insert(geofenceAuditLogs).values({
      workOrderId,
      technicianId: authUser.userId,
      siteAttendanceId: session.id,
      eventType: 'BIOMETRIC_REAUTH_RESUME',
      recordedTimestamp: now,
      deviceLatitude: latitude,
      deviceLongitude: longitude,
      accuracyMeters,
      isTamperVerified: true,
      notes: `Shift resumed following Face ID/Touch ID verification. Unacknowledged break duration: ${additionalBreakSeconds}s.`,
    });

    res.status(200).json({
      message: 'Physical site re-entry confirmed and shift resumed via biometric authentication.',
      session: resumedSession,
      breakDurationSeconds: additionalBreakSeconds,
      biometricVerified,
    });
  } catch (error) {
    console.error('[GEOFENCE ERROR] Resume shift failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to resume shift.',
    });
  }
}
