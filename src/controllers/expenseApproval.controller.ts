import { Request, Response } from 'express';
import { db } from '../config/db';
import {
  expenseClaims,
  systemNotifications,
  workOrders,
} from '../db/schema/index';
import { reviewExpenseClaimSchema } from '../schemas/expense.schema';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { eq } from 'drizzle-orm';

export async function reviewExpenseClaim(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    if (authUser.role !== 'SUPERVISOR') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only supervisors may review, approve, or reject expense claims.',
      });
      return;
    }

    const id = req.params.id as string;

    const parseResult = reviewExpenseClaimSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { approvalStatus, rejectionReason } = parseResult.data;

    const claim = await db.query.expenseClaims.findFirst({
      where: eq(expenseClaims.id, id),
      with: { workOrder: true },
    });

    if (!claim) {
      res.status(404).json({ error: 'NotFound', message: 'Expense claim not found.' });
      return;
    }

    const now = new Date();

    const [updatedClaim] = await db
      .update(expenseClaims)
      .set({
        approvalStatus,
        reviewedBySupervisorId: authUser.userId,
        reviewedAt: now,
        rejectionReason: approvalStatus === 'FLAGGED_REJECTED' ? rejectionReason : null,
        updatedAt: now,
      })
      .where(eq(expenseClaims.id, id))
      .returning();

    // Notify lead technician of the decision
    await db.insert(systemNotifications).values({
      recipientUserId: claim.leadTechnicianId,
      workOrderId: claim.workOrderId,
      notificationType: 'EXPENSE_APPROVED',
      title: `Expense Claim ${approvalStatus === 'APPROVED' ? 'Approved' : 'Flagged & Rejected'}`,
      body:
        approvalStatus === 'APPROVED'
          ? `Supervisor approved expense of ${claim.totalAmount} LKR for vendor '${claim.vendorName}'.`
          : `Supervisor rejected expense claim. Reason: ${rejectionReason}`,
    });

    const fullClaim = await db.query.expenseClaims.findFirst({
      where: eq(expenseClaims.id, id),
      with: {
        workOrder: {
          columns: { id: true, workOrderNumber: true, title: true },
          with: {
            facility: {
              columns: { id: true, companyName: true, facilityName: true, address: true },
            },
          },
        },
        leadTechnician: {
          columns: { id: true, fullName: true, email: true, phone: true },
        },
        reviewedBySupervisor: {
          columns: { id: true, fullName: true, email: true },
        },
        items: true,
      },
    });

    res.status(200).json({
      message: `Expense claim ${approvalStatus === 'APPROVED' ? 'approved' : 'flagged & rejected'} successfully.`,
      claim: fullClaim || updatedClaim,
    });
  } catch (error) {
    console.error('[EXPENSE APPROVAL ERROR] Review failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to review expense claim.',
    });
  }
}
