import { Request, Response } from 'express';
import { db } from '../config/db';
import {
  diagnosticDossiers,
  checklistItems,
  proofPhotos,
  workOrders,
} from '../db/schema/index';
import {
  createOrUpdateDossierSchema,
  submitChecklistSchema,
  attachProofPhotoSchema,
} from '../schemas/dossier.schema';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { eq, desc } from 'drizzle-orm';

export async function createOrUpdateDossier(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const parseResult = createOrUpdateDossierSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const data = parseResult.data;

    // 1. Fetch work order to confirm authorization
    const workOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, data.workOrderId),
      with: { assignments: true },
    });

    if (!workOrder) {
      res.status(404).json({ error: 'NotFound', message: 'Work order not found.' });
      return;
    }

    const isLead = workOrder.leadTechnicianId === authUser.userId;
    const isAssigned = workOrder.assignments.some((a) => a.technicianId === authUser.userId);
    const isSupervisor = authUser.role === 'SUPERVISOR';

    if (!isLead && !isAssigned && !isSupervisor) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only assigned technicians or supervisors may file diagnostic dossiers.',
      });
      return;
    }

    // 2. Check if dossier already exists for this work order
    const existingDossier = await db.query.diagnosticDossiers.findFirst({
      where: eq(diagnosticDossiers.workOrderId, data.workOrderId),
    });

    const now = new Date();

    if (existingDossier) {
      const updatePayload: Record<string, any> = {
        equipmentModel: data.equipmentModel,
        updatedAt: now,
      };

      if (data.equipmentSerialNumber !== undefined) {
        updatePayload.equipmentSerialNumber = data.equipmentSerialNumber;
      }
      if (data.baselineSuctionPressurePsi !== undefined) {
        updatePayload.baselineSuctionPressurePsi = data.baselineSuctionPressurePsi.toString();
      }
      if (data.postServiceSuctionPressurePsi !== undefined) {
        updatePayload.postServiceSuctionPressurePsi = data.postServiceSuctionPressurePsi.toString();
      }
      if (data.baselineDischargePressurePsi !== undefined) {
        updatePayload.baselineDischargePressurePsi = data.baselineDischargePressurePsi.toString();
      }
      if (data.postServiceDischargePressurePsi !== undefined) {
        updatePayload.postServiceDischargePressurePsi = data.postServiceDischargePressurePsi.toString();
      }
      if (data.baselineMotorRunningAmps !== undefined) {
        updatePayload.baselineMotorRunningAmps = data.baselineMotorRunningAmps.toString();
      }
      if (data.postServiceMotorRunningAmps !== undefined) {
        updatePayload.postServiceMotorRunningAmps = data.postServiceMotorRunningAmps.toString();
      }
      if (data.baselineCoilTempDifferential !== undefined) {
        updatePayload.baselineCoilTempDifferential = data.baselineCoilTempDifferential.toString();
      }
      if (data.postServiceCoilTempDifferential !== undefined) {
        updatePayload.postServiceCoilTempDifferential = data.postServiceCoilTempDifferential.toString();
      }
      if (data.diagnosticNotes !== undefined) {
        updatePayload.diagnosticNotes = data.diagnosticNotes;
      }
      if (data.isCompleted !== undefined) {
        updatePayload.isCompleted = data.isCompleted;
        if (data.isCompleted) {
          updatePayload.completedAt = now;
        }
      }

      const [updated] = await db
        .update(diagnosticDossiers)
        .set(updatePayload)
        .where(eq(diagnosticDossiers.id, existingDossier.id))
        .returning();

      res.status(200).json({
        message: 'Diagnostic dossier updated successfully.',
        dossier: updated,
      });
      return;
    }

    // 3. Insert new dossier
    const [newDossier] = await db
      .insert(diagnosticDossiers)
      .values({
        workOrderId: data.workOrderId,
        leadTechnicianId: authUser.userId,
        equipmentModel: data.equipmentModel,
        equipmentSerialNumber: data.equipmentSerialNumber || null,
        baselineSuctionPressurePsi: data.baselineSuctionPressurePsi !== undefined ? data.baselineSuctionPressurePsi.toString() : null,
        postServiceSuctionPressurePsi: data.postServiceSuctionPressurePsi !== undefined ? data.postServiceSuctionPressurePsi.toString() : null,
        baselineDischargePressurePsi: data.baselineDischargePressurePsi !== undefined ? data.baselineDischargePressurePsi.toString() : null,
        postServiceDischargePressurePsi: data.postServiceDischargePressurePsi !== undefined ? data.postServiceDischargePressurePsi.toString() : null,
        baselineMotorRunningAmps: data.baselineMotorRunningAmps !== undefined ? data.baselineMotorRunningAmps.toString() : null,
        postServiceMotorRunningAmps: data.postServiceMotorRunningAmps !== undefined ? data.postServiceMotorRunningAmps.toString() : null,
        baselineCoilTempDifferential: data.baselineCoilTempDifferential !== undefined ? data.baselineCoilTempDifferential.toString() : null,
        postServiceCoilTempDifferential: data.postServiceCoilTempDifferential !== undefined ? data.postServiceCoilTempDifferential.toString() : null,
        diagnosticNotes: data.diagnosticNotes || null,
        isCompleted: data.isCompleted ?? false,
        completedAt: data.isCompleted ? now : null,
      })
      .returning();

    res.status(201).json({
      message: 'Diagnostic dossier created successfully.',
      dossier: newDossier,
    });
  } catch (error) {
    console.error('[DOSSIER ERROR] Create/update dossier failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to save diagnostic dossier.',
    });
  }
}

export async function getDossierByWorkOrder(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Search by workOrderId or dossier id
    let dossier = await db.query.diagnosticDossiers.findFirst({
      where: eq(diagnosticDossiers.workOrderId, id),
      with: {
        leadTechnician: {
          columns: { id: true, fullName: true, email: true, role: true },
        },
        checklistItems: true,
        proofPhotos: {
          orderBy: [desc(proofPhotos.capturedTimestamp)],
        },
      },
    });

    if (!dossier) {
      dossier = await db.query.diagnosticDossiers.findFirst({
        where: eq(diagnosticDossiers.id, id),
        with: {
          leadTechnician: {
            columns: { id: true, fullName: true, email: true, role: true },
          },
          checklistItems: true,
          proofPhotos: {
            orderBy: [desc(proofPhotos.capturedTimestamp)],
          },
        },
      });
    }

    if (!dossier) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Diagnostic dossier not found for specified identifier.',
      });
      return;
    }

    // Calculate diagnostic improvement telemetry deltas
    const baseSuction = dossier.baselineSuctionPressurePsi ? parseFloat(dossier.baselineSuctionPressurePsi) : null;
    const postSuction = dossier.postServiceSuctionPressurePsi ? parseFloat(dossier.postServiceSuctionPressurePsi) : null;
    const baseDischarge = dossier.baselineDischargePressurePsi ? parseFloat(dossier.baselineDischargePressurePsi) : null;
    const postDischarge = dossier.postServiceDischargePressurePsi ? parseFloat(dossier.postServiceDischargePressurePsi) : null;
    const baseAmps = dossier.baselineMotorRunningAmps ? parseFloat(dossier.baselineMotorRunningAmps) : null;
    const postAmps = dossier.postServiceMotorRunningAmps ? parseFloat(dossier.postServiceMotorRunningAmps) : null;
    const baseTempDiff = dossier.baselineCoilTempDifferential ? parseFloat(dossier.baselineCoilTempDifferential) : null;
    const postTempDiff = dossier.postServiceCoilTempDifferential ? parseFloat(dossier.postServiceCoilTempDifferential) : null;

    const totalChecklist = dossier.checklistItems.length;
    const checkedCount = dossier.checklistItems.filter((item) => item.isChecked).length;
    const completionRatePercent = totalChecklist > 0 ? Math.round((checkedCount / totalChecklist) * 100) : 0;

    res.status(200).json({
      dossier,
      telemetryAnalysis: {
        suctionPressureDeltaPsi: baseSuction !== null && postSuction !== null ? +(postSuction - baseSuction).toFixed(2) : null,
        dischargePressureDeltaPsi: baseDischarge !== null && postDischarge !== null ? +(postDischarge - baseDischarge).toFixed(2) : null,
        motorRunningAmpsReduction: baseAmps !== null && postAmps !== null ? +(baseAmps - postAmps).toFixed(2) : null,
        coilTempDifferentialGain: baseTempDiff !== null && postTempDiff !== null ? +(postTempDiff - baseTempDiff).toFixed(2) : null,
        checklistCompletionRatePercent: completionRatePercent,
        totalPhotosAttached: dossier.proofPhotos.length,
      },
    });
  } catch (error) {
    console.error('[DOSSIER ERROR] Fetch dossier failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve diagnostic dossier.',
    });
  }
}

export async function submitChecklistItems(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const parseResult = submitChecklistSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    // Verify dossier exists
    const dossier = await db.query.diagnosticDossiers.findFirst({
      where: eq(diagnosticDossiers.id, id),
    });

    if (!dossier) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Diagnostic dossier not found.',
      });
      return;
    }

    const { items } = parseResult.data;

    const valuesToInsert = items.map((item) => ({
      diagnosticDossierId: dossier.id,
      category: item.category,
      itemLabel: item.itemLabel,
      isChecked: item.isChecked,
      notes: item.notes || null,
    }));

    const insertedItems = await db.insert(checklistItems).values(valuesToInsert).returning();

    res.status(201).json({
      message: `${insertedItems.length} checklist items logged successfully.`,
      checklistItems: insertedItems,
    });
  } catch (error) {
    console.error('[DOSSIER ERROR] Submit checklist failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to submit checklist items.',
    });
  }
}

export async function attachProofPhoto(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const parseResult = attachProofPhotoSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    // Verify dossier exists
    const dossier = await db.query.diagnosticDossiers.findFirst({
      where: eq(diagnosticDossiers.id, id),
    });

    if (!dossier) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Diagnostic dossier not found.',
      });
      return;
    }

    const data = parseResult.data;

    const [newPhoto] = await db
      .insert(proofPhotos)
      .values({
        diagnosticDossierId: dossier.id,
        photoType: data.photoType,
        photoUrl: data.photoUrl,
        capturedLatitude: data.capturedLatitude,
        capturedLongitude: data.capturedLongitude,
        isLiveCameraCaptured: data.isLiveCameraCaptured,
        capturedTimestamp: data.capturedTimestamp ? new Date(data.capturedTimestamp) : new Date(),
      })
      .returning();

    res.status(201).json({
      message: 'Proof photo attached successfully with geotag metadata.',
      proofPhoto: newPhoto,
    });
  } catch (error) {
    console.error('[DOSSIER ERROR] Attach photo failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to attach proof photo.',
    });
  }
}
