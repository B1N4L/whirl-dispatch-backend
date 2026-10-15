import { Request, Response } from 'express';
import { db } from '../config/db';
import { workOrders, fleetAssets } from '../db/schema/index';
import { updateWorkOrderStatusSchema } from '../schemas/workOrder.schema';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { eq } from 'drizzle-orm';

export async function updateWorkOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const id = req.params.id as string;
    const parseResult = updateWorkOrderStatusSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { status, actualStartTime, actualEndTime } = parseResult.data;

    const existing = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, id),
      with: {
        assignments: true,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'NotFound', message: 'Work order not found.' });
      return;
    }

    // Role check: Only assigned team members or supervisors can update status
    const isSupervisor = authUser.role === 'SUPERVISOR';
    const isLead = existing.leadTechnicianId === authUser.userId;
    const isAssigned = existing.assignments.some((a) => a.technicianId === authUser.userId);

    if (!isSupervisor && !isLead && !isAssigned) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You are not assigned to this work order.',
      });
      return;
    }

    const updatePayload: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };

    if (actualStartTime) {
      updatePayload.actualStartTime = new Date(actualStartTime);
    } else if (status === 'ON_SITE_ACTIVE' && !existing.actualStartTime) {
      updatePayload.actualStartTime = new Date();
    }

    if (actualEndTime) {
      updatePayload.actualEndTime = new Date(actualEndTime);
    } else if (status === 'COMPLETED' && !existing.actualEndTime) {
      updatePayload.actualEndTime = new Date();
    }

    const [updated] = await db
      .update(workOrders)
      .set(updatePayload)
      .where(eq(workOrders.id, id))
      .returning();

    // If job is completed or cancelled, release assigned fleet asset back to AVAILABLE
    if ((status === 'COMPLETED' || status === 'CANCELLED') && existing.assignedFleetAssetId) {
      await db
        .update(fleetAssets)
        .set({ status: 'AVAILABLE', updatedAt: new Date() })
        .where(eq(fleetAssets.id, existing.assignedFleetAssetId));
    }

    res.status(200).json({
      message: `Work order state transitioned to '${status}'.`,
      workOrder: updated,
    });
  } catch (error) {
    console.error('[WORK ORDER ERROR] Status update failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update work order lifecycle status.',
    });
  }
}
