import { Request, Response } from 'express';
import { db } from '../config/db';
import {
  siteAttendance,
  geofenceAuditLogs,
  workOrders,
  clientFacilities,
} from '../db/schema/index';
import { clockInSchema, clockOutSchema } from '../schemas/attendance.schema';
import { isInsideGeofence } from '../utils/haversine';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { eq, and, desc, isNull } from 'drizzle-orm';

export async function clockIn(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const parseResult = clockInSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { workOrderId, latitude, longitude, accuracyMeters, biometricVerified } = parseResult.data;

    // 1. Fetch work order and facility location
    const workOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId),
      with: {
        facility: true,
        assignments: true,
      },
    });

    if (!workOrder) {
      res.status(404).json({ error: 'NotFound', message: 'Work order not found.' });
      return;
    }

    // 2. Validate technician is assigned to this job
    const isLead = workOrder.leadTechnicianId === authUser.userId;
    const isAssigned = workOrder.assignments.some((a) => a.technicianId === authUser.userId);
    const isSupervisor = authUser.role === 'SUPERVISOR';

    if (!isLead && !isAssigned && !isSupervisor) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You are not assigned to this maintenance work order.',
      });
      return;
    }

    // 3. Haversine Geofence Verification
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
        message: `Device is outside client site geofence perimeter. Distance: ${geofenceCheck.distanceMeters}m, Required: <= ${workOrder.facility.geofenceRadius}m.`,
        currentDistanceMeters: geofenceCheck.distanceMeters,
        allowedRadiusMeters: workOrder.facility.geofenceRadius,
      });
      return;
    }

    // 4. Check if technician already has an active (unclosed) session
    const activeSession = await db.query.siteAttendance.findFirst({
      where: and(
        eq(siteAttendance.workOrderId, workOrderId),
        eq(siteAttendance.technicianId, authUser.userId),
        isNull(siteAttendance.clockOutTimestamp)
      ),
    });

    if (activeSession) {
      res.status(409).json({
        error: 'SessionActive',
        message: 'Technician is already clocked into an active shift on this work order.',
        session: activeSession,
      });
      return;
    }

    // 5. Create new Site Attendance record
    const clockInTime = new Date();
    const [newSession] = await db
      .insert(siteAttendance)
      .values({
        workOrderId,
        technicianId: authUser.userId,
        clockInTimestamp: clockInTime,
        sessionStatus: 'ACTIVE_ON_SITE',
        totalBillableSeconds: 0,
        totalBreakSeconds: 0,
      })
      .returning();

    // 6. Log Tamper-Resistant Geofence Entry in Audit Logs
    await db.insert(geofenceAuditLogs).values({
      workOrderId,
      technicianId: authUser.userId,
      siteAttendanceId: newSession.id,
      eventType: 'GEOFENCE_ENTER',
      recordedTimestamp: clockInTime,
      deviceLatitude: latitude,
      deviceLongitude: longitude,
      accuracyMeters,
      isTamperVerified: true,
      notes: `Verified site arrival at ${workOrder.facility.facilityName}. Biometric authenticated: ${biometricVerified}. Distance: ${geofenceCheck.distanceMeters}m.`,
    });

    // 7. Transition Work Order state to ON_SITE_ACTIVE if not already active
    if (workOrder.status === 'DISPATCHED' || workOrder.status === 'EN_ROUTE') {
      await db
        .update(workOrders)
        .set({
          status: 'ON_SITE_ACTIVE',
          actualStartTime: workOrder.actualStartTime || clockInTime,
          updatedAt: clockInTime,
        })
        .where(eq(workOrders.id, workOrderId));
    }

    res.status(201).json({
      message: 'On-site arrival verified and clocked in successfully.',
      session: newSession,
      geofenceVerification: {
        facilityName: workOrder.facility.facilityName,
        distanceMeters: geofenceCheck.distanceMeters,
        perimeterVerified: true,
        biometricVerified,
      },
    });
  } catch (error) {
    console.error('[ATTENDANCE ERROR] Clock in failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to process clock-in request.',
    });
  }
}

export async function clockOut(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const parseResult = clockOutSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { workOrderId, latitude, longitude, accuracyMeters } = parseResult.data;

    // 1. Find active or break-paused attendance session
    let activeSession = await db.query.siteAttendance.findFirst({
      where: and(
        eq(siteAttendance.workOrderId, workOrderId),
        eq(siteAttendance.technicianId, authUser.userId),
        isNull(siteAttendance.clockOutTimestamp)
      ),
      orderBy: [desc(siteAttendance.createdAt)],
    });

    // Fallback: If technician changed selected work order in UI, find any unclosed session for this technician
    if (!activeSession) {
      activeSession = await db.query.siteAttendance.findFirst({
        where: and(
          eq(siteAttendance.technicianId, authUser.userId),
          isNull(siteAttendance.clockOutTimestamp)
        ),
        orderBy: [desc(siteAttendance.createdAt)],
      });
    }

    if (!activeSession) {
      res.status(404).json({
        error: 'NotFound',
        message: 'No active on-site shift session found to clock out from.',
      });
      return;
    }

    // 2. Calculate duration
    const clockOutTime = new Date();
    const elapsedSeconds = Math.max(
      0,
      Math.floor((clockOutTime.getTime() - activeSession.clockInTimestamp.getTime()) / 1000)
    );
    const billableSeconds = Math.max(0, elapsedSeconds - (activeSession.totalBreakSeconds || 0));

    // 3. Update session
    const [updatedSession] = await db
      .update(siteAttendance)
      .set({
        clockOutTimestamp: clockOutTime,
        totalBillableSeconds: billableSeconds,
        sessionStatus: 'CLOCKED_OUT',
        updatedAt: clockOutTime,
      })
      .where(eq(siteAttendance.id, activeSession.id))
      .returning();

    // 4. Record audit log
    await db.insert(geofenceAuditLogs).values({
      workOrderId,
      technicianId: authUser.userId,
      siteAttendanceId: activeSession.id,
      eventType: 'BREAK_PAUSED',
      recordedTimestamp: clockOutTime,
      deviceLatitude: latitude,
      deviceLongitude: longitude,
      accuracyMeters,
      isTamperVerified: true,
      notes: `Clock-out recorded. Total billable duration: ${Math.round((billableSeconds / 3600) * 100) / 100} hours.`,
    });

    res.status(200).json({
      message: 'Clocked out successfully.',
      session: updatedSession,
      summary: {
        totalHoursWorked: Math.round((billableSeconds / 3600) * 100) / 100,
        totalBillableSeconds: billableSeconds,
        breakSeconds: activeSession.totalBreakSeconds,
      },
    });
  } catch (error) {
    console.error('[ATTENDANCE ERROR] Clock out failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to process clock-out request.',
    });
  }
}

export async function getAttendanceTimeline(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const sessions = await db.query.siteAttendance.findMany({
      where: eq(siteAttendance.workOrderId, id),
      with: {
        technician: {
          columns: { id: true, fullName: true, email: true, role: true },
        },
        auditLogs: {
          orderBy: (logs, { asc }) => [asc(logs.recordedTimestamp)],
        },
      },
      orderBy: [desc(siteAttendance.createdAt)],
    });

    res.status(200).json({
      workOrderId: id,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error('[ATTENDANCE ERROR] Timeline fetch failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve attendance timeline.',
    });
  }
}

export async function getCurrentActiveAttendance(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const activeSession = await db.query.siteAttendance.findFirst({
      where: and(
        eq(siteAttendance.technicianId, authUser.userId),
        isNull(siteAttendance.clockOutTimestamp)
      ),
      with: {
        workOrder: {
          with: { facility: true },
        },
      },
      orderBy: [desc(siteAttendance.createdAt)],
    });

    res.status(200).json({
      active: !!activeSession,
      session: activeSession || null,
    });
  } catch (error) {
    console.error('[ATTENDANCE ERROR] Get current active attendance failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve active attendance status.',
    });
  }
}
