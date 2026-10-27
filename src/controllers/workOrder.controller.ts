import { Request, Response } from 'express';
import { db } from '../config/db';
import {
  workOrders,
  workOrderAssignments,
  clientFacilities,
  fleetAssets,
  users,
  systemNotifications,
} from '../db/schema/index';
import { createWorkOrderSchema } from '../schemas/workOrder.schema';
import { buildEventKitCalendarPayload } from '../services/calendarPayload.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { eq, desc, inArray } from 'drizzle-orm';

export async function createWorkOrder(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required to create dispatches.',
      });
      return;
    }

    const parseResult = createWorkOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const data = parseResult.data;

    // 1. Verify Facility exists
    const facility = await db.query.clientFacilities.findFirst({
      where: eq(clientFacilities.id, data.clientFacilityId),
    });

    if (!facility) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Designated client commercial facility not found.',
      });
      return;
    }

    // 2. Verify Lead Tech exists and has valid role
    const leadTech = await db.query.users.findFirst({
      where: eq(users.id, data.leadTechnicianId),
    });

    if (!leadTech || (leadTech.role !== 'LEAD_TECHNICIAN' && leadTech.role !== 'TECHNICIAN')) {
      res.status(400).json({
        error: 'InvalidAssignment',
        message: 'Lead technician must be an active field lead or senior technician.',
      });
      return;
    }

    // 3. Prevent Fleet Asset double-booking / check status
    let assignedAsset = null;
    if (data.assignedFleetAssetId) {
      assignedAsset = await db.query.fleetAssets.findFirst({
        where: eq(fleetAssets.id, data.assignedFleetAssetId),
      });

      if (!assignedAsset) {
        res.status(404).json({
          error: 'NotFound',
          message: 'Allocated fleet asset not found in company registry.',
        });
        return;
      }

      if (assignedAsset.status === 'UNDER_MAINTENANCE') {
        res.status(409).json({
          error: 'AssetUnavailable',
          message: `Fleet asset '${assignedAsset.assetCode}' is currently under maintenance and cannot be deployed.`,
        });
        return;
      }
    }

    // 4. Generate sequential work order number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const workOrderNumber = `WO-2026-${randomSuffix}`;

    const [newWorkOrder] = await db
      .insert(workOrders)
      .values({
        workOrderNumber,
        clientFacilityId: data.clientFacilityId,
        supervisorId: authUser.userId,
        leadTechnicianId: data.leadTechnicianId,
        assignedFleetAssetId: data.assignedFleetAssetId || null,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: 'DISPATCHED',
        scheduledStartTime: new Date(data.scheduledStartTime),
        scheduledEndTime: new Date(data.scheduledEndTime),
      })
      .returning();

    // 5. Update vehicle status to DEPLOYED
    if (data.assignedFleetAssetId) {
      await db
        .update(fleetAssets)
        .set({ status: 'DEPLOYED', updatedAt: new Date() })
        .where(eq(fleetAssets.id, data.assignedFleetAssetId));
    }

    // 6. Assign team members
    const teamIds = Array.from(new Set([data.leadTechnicianId, ...data.assignedTechnicianIds]));
    if (teamIds.length > 0) {
      const assignmentInserts = teamIds.map((techId) => ({
        workOrderId: newWorkOrder.id,
        technicianId: techId,
      }));
      await db.insert(workOrderAssignments).values(assignmentInserts);

      // 7. Dispatch push notifications to assigned team
      const notificationInserts = teamIds.map((techId) => ({
        recipientUserId: techId,
        workOrderId: newWorkOrder.id,
        notificationType: 'URGENT_DISPATCH' as const,
        title: `New Dispatch: ${newWorkOrder.workOrderNumber}`,
        body: `You have been dispatched to ${facility.facilityName} for '${newWorkOrder.title}'.`,
      }));
      await db.insert(systemNotifications).values(notificationInserts);
    }

    res.status(201).json({
      message: 'Work order created and dispatched successfully.',
      workOrder: {
        ...newWorkOrder,
        facility,
        fleetAsset: assignedAsset,
        facilityName: facility.facilityName,
        assignedFleetAsset: assignedAsset ? assignedAsset.assetCode : null,
      },
    });
  } catch (error) {
    console.error('[WORK ORDER ERROR] Creation failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create and dispatch work order.',
    });
  }
}

export async function getWorkOrders(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const { status, priority } = req.query;

    let allOrders = await db.query.workOrders.findMany({
      orderBy: [desc(workOrders.createdAt)],
      with: {
        facility: true,
        fleetAsset: true,
        leadTechnician: {
          columns: { id: true, fullName: true, email: true, phone: true, role: true, hourlyLaborRate: true },
        },
        supervisor: {
          columns: { id: true, fullName: true, email: true },
        },
        assignments: {
          with: {
            technician: {
              columns: { id: true, fullName: true, email: true, phone: true, role: true, hourlyLaborRate: true },
            },
          },
        },
      },
    });

    // Role-based filtering:
    // 1. Technicians only see jobs they are assigned to
    if (authUser.role === 'TECHNICIAN' || authUser.role === 'LEAD_TECHNICIAN') {
      allOrders = allOrders.filter((wo) => {
        const isLead = wo.leadTechnicianId === authUser.userId;
        const isAssigned = wo.assignments.some((a) => a.technicianId === authUser.userId);
        return isLead || isAssigned;
      });
    }

    // 2. Payment Clerks only see dispatches that are finished and ready for invoicing (COMPLETED or BILLED)
    if (authUser.role === 'PAYMENT_CLERK') {
      allOrders = allOrders.filter(
        (wo) => wo.status === 'COMPLETED' || wo.status === 'BILLED'
      );
    }

    // Optional query param filters
    if (status && typeof status === 'string') {
      allOrders = allOrders.filter((wo) => wo.status === status);
    }
    if (priority && typeof priority === 'string') {
      allOrders = allOrders.filter((wo) => wo.priority === priority);
    }

    res.status(200).json({
      count: allOrders.length,
      workOrders: allOrders,
    });
  } catch (error) {
    console.error('[WORK ORDER ERROR] Failed to fetch list:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve work orders.',
    });
  }
}

export async function getWorkOrderDetail(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const workOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, id),
      with: {
        facility: true,
        fleetAsset: true,
        leadTechnician: {
          columns: { id: true, fullName: true, email: true, phone: true, role: true, hourlyLaborRate: true },
        },
        supervisor: {
          columns: { id: true, fullName: true, email: true },
        },
        assignments: {
          with: {
            technician: {
              columns: { id: true, fullName: true, email: true, phone: true, role: true, hourlyLaborRate: true },
            },
          },
        },
      },
    });

    if (!workOrder) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Work order dispatch not found.',
      });
      return;
    }

    // Build EventKit calendar payload for native iOS Calendar synchronization
    const eventKitPayload = buildEventKitCalendarPayload({
      workOrderNumber: workOrder.workOrderNumber,
      title: workOrder.title,
      description: workOrder.description,
      scheduledStartTime: workOrder.scheduledStartTime,
      scheduledEndTime: workOrder.scheduledEndTime,
      facility: {
        facilityName: workOrder.facility.facilityName,
        address: workOrder.facility.address,
        latitude: workOrder.facility.latitude,
        longitude: workOrder.facility.longitude,
        geofenceRadius: workOrder.facility.geofenceRadius,
      },
      fleetAsset: workOrder.fleetAsset,
    });

    res.status(200).json({
      workOrder,
      eventKitPayload,
    });
  } catch (error) {
    console.error('[WORK ORDER ERROR] Failed to fetch detail:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve work order detail.',
    });
  }
}
