import { Request, Response } from 'express';
import { db } from '../config/db';
import { billingInvoices, workOrders } from '../db/schema/index';
import { compileWorkOrderBillingMetrics } from '../services/billingCalculator.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateInvoiceStatusSchema = z.object({
  status: z.enum([
    'DRAFT_ESTIMATE',
    'APPROVED_BY_SUPERVISOR',
    'ISSUED_TO_CLIENT',
    'PAID',
  ]),
});

export async function generateEstimate(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    if (authUser.role !== 'PAYMENT_CLERK' && authUser.role !== 'SUPERVISOR') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only Payment Clerks or Supervisors may generate billing estimates.',
      });
      return;
    }

    const workOrderId = req.params.workOrderId as string;

    // Verify work order status: Clerks cannot bill in-progress work
    const targetOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId),
    });

    if (!targetOrder) {
      res.status(404).json({ error: 'NotFound', message: 'Work order dispatch not found.' });
      return;
    }

    if (authUser.role === 'PAYMENT_CLERK' && targetOrder.status !== 'COMPLETED' && targetOrder.status !== 'BILLED') {
      res.status(400).json({
        error: 'WorkOrderInProgress',
        message: 'Invoicing is restricted for in-progress work orders. The dispatch must be COMPLETED before an invoice can be compiled or issued.',
      });
      return;
    }

    const partsMarkupOverride = typeof req.body?.partsMarkupPercent === 'number'
      ? req.body.partsMarkupPercent
      : undefined;

    const calculation = await compileWorkOrderBillingMetrics(workOrderId, partsMarkupOverride);

    // Check if invoice already exists for this work order
    const existingInvoice = await db.query.billingInvoices.findFirst({
      where: eq(billingInvoices.workOrderId, workOrderId),
    });

    const now = new Date();

    if (existingInvoice) {
      const [updated] = await db
        .update(billingInvoices)
        .set({
          totalBillableLaborHours: calculation.totalBillableLaborHours.toFixed(2),
          hourlyLaborRateApplied: calculation.hourlyLaborRateApplied.toFixed(2),
          subtotalLabor: calculation.subtotalLabor.toFixed(2),
          subtotalApprovedParts: calculation.subtotalApprovedParts.toFixed(2),
          partsMarkupPercentApplied: calculation.partsMarkupPercentApplied.toFixed(2),
          subtotalPartsWithMarkup: calculation.subtotalPartsWithMarkup.toFixed(2),
          fleetEquipmentFee: calculation.fleetEquipmentFee.toFixed(2),
          taxPercent: calculation.taxPercent.toFixed(2),
          taxAmount: calculation.taxAmount.toFixed(2),
          grandTotal: calculation.grandTotal.toFixed(2),
          updatedAt: now,
        })
        .where(eq(billingInvoices.id, existingInvoice.id))
        .returning();

      res.status(200).json({
        message: 'Billing estimate re-compiled and updated successfully.',
        invoice: updated,
        calculation,
      });
      return;
    }

    // Insert new billing invoice
    const [newInvoice] = await db
      .insert(billingInvoices)
      .values({
        invoiceNumber: calculation.invoiceNumber,
        workOrderId: calculation.workOrderId,
        clientFacilityId: calculation.clientFacilityId,
        clerkId: authUser.userId,
        totalBillableLaborHours: calculation.totalBillableLaborHours.toFixed(2),
        hourlyLaborRateApplied: calculation.hourlyLaborRateApplied.toFixed(2),
        subtotalLabor: calculation.subtotalLabor.toFixed(2),
        subtotalApprovedParts: calculation.subtotalApprovedParts.toFixed(2),
        partsMarkupPercentApplied: calculation.partsMarkupPercentApplied.toFixed(2),
        subtotalPartsWithMarkup: calculation.subtotalPartsWithMarkup.toFixed(2),
        fleetEquipmentFee: calculation.fleetEquipmentFee.toFixed(2),
        taxPercent: calculation.taxPercent.toFixed(2),
        taxAmount: calculation.taxAmount.toFixed(2),
        grandTotal: calculation.grandTotal.toFixed(2),
        status: 'DRAFT_ESTIMATE',
        issueDate: now,
        dueDate: calculation.dueDate,
      })
      .returning();

    res.status(201).json({
      message: 'Official billing estimate compiled successfully.',
      invoice: newInvoice,
      calculation,
    });
  } catch (error: any) {
    console.error('[BILLING ERROR] Generate estimate failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Failed to compile billing estimate.',
    });
  }
}

export async function previewEstimate(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const workOrderId = req.params.workOrderId as string;

    const targetOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId),
    });

    if (!targetOrder) {
      res.status(404).json({ error: 'NotFound', message: 'Work order dispatch not found.' });
      return;
    }

    if (authUser.role === 'PAYMENT_CLERK' && targetOrder.status !== 'COMPLETED' && targetOrder.status !== 'BILLED') {
      res.status(400).json({
        error: 'WorkOrderInProgress',
        message: 'Cannot preview estimate for in-progress work order. The dispatch must be COMPLETED.',
      });
      return;
    }

    const markupParam = req.query.partsMarkupPercent
      ? parseFloat(req.query.partsMarkupPercent as string)
      : undefined;

    const calculation = await compileWorkOrderBillingMetrics(workOrderId, markupParam);

    const existingInvoice = await db.query.billingInvoices.findFirst({
      where: eq(billingInvoices.workOrderId, workOrderId),
      with: {
        facility: true,
        clerk: {
          columns: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    res.status(200).json({
      calculation,
      existingInvoice: existingInvoice || null,
    });
  } catch (error: any) {
    console.error('[BILLING ERROR] Preview estimate failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message || 'Failed to preview billing estimate.',
    });
  }
}

export async function getInvoice(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Search by invoice ID or work order ID
    let invoice = await db.query.billingInvoices.findFirst({
      where: eq(billingInvoices.id, id),
      with: {
        facility: true,
        clerk: {
          columns: { id: true, fullName: true, email: true, role: true },
        },
        workOrder: true,
      },
    });

    if (!invoice) {
      invoice = await db.query.billingInvoices.findFirst({
        where: eq(billingInvoices.workOrderId, id),
        with: {
          facility: true,
          clerk: {
            columns: { id: true, fullName: true, email: true, role: true },
          },
          workOrder: true,
        },
      });
    }

    if (!invoice) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Billing invoice not found for specified identifier.',
      });
      return;
    }

    res.status(200).json({
      invoice,
    });
  } catch (error) {
    console.error('[BILLING ERROR] Fetch invoice failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve billing invoice.',
    });
  }
}

export async function updateInvoiceStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const parseResult = updateInvoiceStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { status } = parseResult.data;

    const existingInvoice = await db.query.billingInvoices.findFirst({
      where: eq(billingInvoices.id, id),
    });

    if (!existingInvoice) {
      res.status(404).json({ error: 'NotFound', message: 'Invoice not found.' });
      return;
    }

    const now = new Date();

    const [updatedInvoice] = await db
      .update(billingInvoices)
      .set({
        status,
        updatedAt: now,
      })
      .where(eq(billingInvoices.id, id))
      .returning();

    // If invoice is issued or paid, transition work order to BILLED
    if (status === 'ISSUED_TO_CLIENT' || status === 'PAID') {
      await db
        .update(workOrders)
        .set({
          status: 'BILLED',
          updatedAt: now,
        })
        .where(eq(workOrders.id, existingInvoice.workOrderId));
    }

    res.status(200).json({
      message: `Invoice status transitioned to ${status}.`,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('[BILLING ERROR] Update status failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update invoice status.',
    });
  }
}
