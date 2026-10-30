import { Request, Response } from 'express';
import { db } from '../config/db';
import {
  expenseClaims,
  expenseItems,
  workOrders,
  systemNotifications,
} from '../db/schema/index';
import { createExpenseClaimSchema } from '../schemas/expense.schema';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { eq, desc, inArray } from 'drizzle-orm';

const EXPENSE_THRESHOLD_LKR = Number(process.env.EXPENSE_THRESHOLD_LKR || 25000);

export async function createExpenseClaim(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const parseResult = createExpenseClaimSchema.safeParse(req.body);
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
        message: 'Only assigned technicians or supervisors may submit emergency parts expenses.',
      });
      return;
    }

    // 2. Calculate item totals and grand total
    let calculatedTotal = 0;
    const preparedItems = data.items.map((item) => {
      const lineTotal = +(item.quantity * item.unitPrice).toFixed(2);
      calculatedTotal += lineTotal;
      return {
        partDescription: item.partDescription,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: lineTotal.toFixed(2),
      };
    });

    calculatedTotal = +calculatedTotal.toFixed(2);
    const isExceeded = calculatedTotal > EXPENSE_THRESHOLD_LKR;

    // 3. Create expense claim
    const now = new Date();
    const [newClaim] = await db
      .insert(expenseClaims)
      .values({
        workOrderId: data.workOrderId,
        leadTechnicianId: authUser.userId,
        vendorName: data.vendorName,
        receiptNumber: data.receiptNumber || null,
        totalAmount: calculatedTotal.toFixed(2),
        currency: data.currency || 'LKR',
        receiptImageUrl: data.receiptImageUrl || '',
        receiptStoreLatitude: data.receiptStoreLatitude,
        receiptStoreLongitude: data.receiptStoreLongitude,
        receiptCapturedAt: data.receiptCapturedAt ? new Date(data.receiptCapturedAt) : now,
        isThresholdExceeded: isExceeded,
        approvalStatus: 'PENDING_SUPERVISOR_APPROVAL',
      })
      .returning();

    // 4. Insert line items
    const itemsToInsert = preparedItems.map((item) => ({
      expenseClaimId: newClaim.id,
      partDescription: item.partDescription,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    const insertedItems = await db.insert(expenseItems).values(itemsToInsert).returning();

    // 5. If threshold exceeded, notify supervisor
    if (isExceeded) {
      await db.insert(systemNotifications).values({
        recipientUserId: workOrder.supervisorId,
        workOrderId: data.workOrderId,
        notificationType: 'EXPENSE_THRESHOLD_ALERT',
        title: 'Emergency Expense Threshold Exceeded',
        body: `Expense claim of ${calculatedTotal} LKR from '${data.vendorName}' exceeds preset threshold of ${EXPENSE_THRESHOLD_LKR} LKR. Requires supervisor optical inspection.`,
      });
    }

    res.status(201).json({
      message: 'Emergency parts expense claim submitted successfully.',
      claim: newClaim,
      items: insertedItems,
      thresholdAlert: isExceeded
        ? {
            exceeded: true,
            limitLkr: EXPENSE_THRESHOLD_LKR,
            claimedLkr: calculatedTotal,
            notice: 'Supervisor alert dispatched for review.',
          }
        : null,
    });
  } catch (error) {
    console.error('[EXPENSE ERROR] Create claim failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to record emergency parts expense.',
    });
  }
}

export async function getExpensesByWorkOrder(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const claims = await db.query.expenseClaims.findMany({
      where: eq(expenseClaims.workOrderId, id),
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
          columns: { id: true, fullName: true, email: true },
        },
        reviewedBySupervisor: {
          columns: { id: true, fullName: true, email: true },
        },
        items: true,
      },
      orderBy: [desc(expenseClaims.createdAt)],
    });

    // Summary calculations
    let totalClaimed = 0;
    let totalApproved = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const claim of claims) {
      const amount = parseFloat(claim.totalAmount);
      totalClaimed += amount;
      if (claim.approvalStatus === 'APPROVED') {
        totalApproved += amount;
        approvedCount++;
      } else if (claim.approvalStatus === 'PENDING_SUPERVISOR_APPROVAL') {
        pendingCount++;
      } else if (claim.approvalStatus === 'FLAGGED_REJECTED') {
        rejectedCount++;
      }
    }

    res.status(200).json({
      workOrderId: id,
      claimsCount: claims.length,
      claims,
      financialSummary: {
        totalClaimedAmount: +totalClaimed.toFixed(2),
        totalApprovedAmount: +totalApproved.toFixed(2),
        pendingClaimsCount: pendingCount,
        approvedClaimsCount: approvedCount,
        rejectedClaimsCount: rejectedCount,
      },
    });
  } catch (error) {
    console.error('[EXPENSE ERROR] Fetch claims failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve expense claims.',
    });
  }
}

export async function getActiveDispatchExpenses(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const targetUserId = (req.query.technicianId as string) || authUser.userId;

    const activeOrders = await db.query.workOrders.findMany({
      where: inArray(workOrders.status, [
        'DISPATCHED',
        'EN_ROUTE',
        'ON_SITE_ACTIVE',
        'UNACKNOWLEDGED_BREAK',
        'AWAITING_PARTS_APPROVAL',
      ]),
      orderBy: [desc(workOrders.createdAt)],
      with: {
        facility: true,
        fleetAsset: true,
        assignments: true,
      },
    });

    const userActiveOrders = activeOrders.filter((wo) => {
      const isLead = wo.leadTechnicianId === targetUserId;
      const isAssigned = wo.assignments.some((a) => a.technicianId === targetUserId);
      return isLead || isAssigned;
    });

    if (userActiveOrders.length === 0) {
      res.status(200).json({
        hasActiveDispatch: false,
        workOrderId: null,
        workOrder: null,
        claimsCount: 0,
        claims: [],
        financialSummary: {
          totalClaimedAmount: 0,
          totalApprovedAmount: 0,
          pendingClaimsCount: 0,
          approvedClaimsCount: 0,
          rejectedClaimsCount: 0,
        },
      });
      return;
    }

    const activeJob =
      userActiveOrders.find((wo) =>
        ['ON_SITE_ACTIVE', 'UNACKNOWLEDGED_BREAK', 'AWAITING_PARTS_APPROVAL', 'EN_ROUTE'].includes(wo.status)
      ) || userActiveOrders.find((wo) => wo.status === 'DISPATCHED') || userActiveOrders[0];

    const claims = await db.query.expenseClaims.findMany({
      where: eq(expenseClaims.workOrderId, activeJob.id),
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
          columns: { id: true, fullName: true, email: true },
        },
        reviewedBySupervisor: {
          columns: { id: true, fullName: true, email: true },
        },
        items: true,
      },
      orderBy: [desc(expenseClaims.createdAt)],
    });

    let totalClaimed = 0;
    let totalApproved = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const claim of claims) {
      const amount = parseFloat(claim.totalAmount) || 0;
      totalClaimed += amount;
      if (claim.approvalStatus === 'APPROVED') {
        totalApproved += amount;
        approvedCount++;
      } else if (claim.approvalStatus === 'PENDING_SUPERVISOR_APPROVAL') {
        pendingCount++;
      } else if (claim.approvalStatus === 'FLAGGED_REJECTED') {
        rejectedCount++;
      }
    }

    res.status(200).json({
      hasActiveDispatch: true,
      workOrderId: activeJob.id,
      workOrder: activeJob,
      claimsCount: claims.length,
      claims,
      financialSummary: {
        totalClaimedAmount: +totalClaimed.toFixed(2),
        totalApprovedAmount: +totalApproved.toFixed(2),
        pendingClaimsCount: pendingCount,
        approvedClaimsCount: approvedCount,
        rejectedClaimsCount: rejectedCount,
      },
    });
  } catch (error) {
    console.error('[EXPENSE ERROR] Failed to fetch active dispatch expenses:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve active dispatch expenses.',
    });
  }
}

export async function getAllExpenses(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const statusParam = req.query.status as string | undefined;

    const whereClause =
      statusParam &&
      ['PENDING_SUPERVISOR_APPROVAL', 'APPROVED', 'FLAGGED_REJECTED'].includes(statusParam)
        ? eq(expenseClaims.approvalStatus, statusParam as any)
        : undefined;

    const claims = await db.query.expenseClaims.findMany({
      where: whereClause,
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
          columns: { id: true, fullName: true, email: true },
        },
        reviewedBySupervisor: {
          columns: { id: true, fullName: true, email: true },
        },
        items: true,
      },
      orderBy: [desc(expenseClaims.createdAt)],
    });

    let totalClaimed = 0;
    let totalApproved = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const claim of claims) {
      const amount = parseFloat(claim.totalAmount);
      totalClaimed += amount;
      if (claim.approvalStatus === 'APPROVED') {
        totalApproved += amount;
        approvedCount++;
      } else if (claim.approvalStatus === 'PENDING_SUPERVISOR_APPROVAL') {
        pendingCount++;
      } else if (claim.approvalStatus === 'FLAGGED_REJECTED') {
        rejectedCount++;
      }
    }

    res.status(200).json({
      count: claims.length,
      expenses: claims,
      claims,
      financialSummary: {
        totalClaimedAmount: +totalClaimed.toFixed(2),
        totalApprovedAmount: +totalApproved.toFixed(2),
        pendingClaimsCount: pendingCount,
        approvedClaimsCount: approvedCount,
        rejectedClaimsCount: rejectedCount,
      },
    });
  } catch (error) {
    console.error('[EXPENSE ERROR] Fetch all claims failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve expense claims.',
    });
  }
}
