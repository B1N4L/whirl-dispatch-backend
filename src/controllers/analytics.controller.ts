import { Request, Response } from 'express';
import { db } from '../config/db';
import {
  billingInvoices,
  siteAttendance,
  expenseClaims,
  workOrders,
} from '../db/schema/index';
import { eq, and } from 'drizzle-orm';

export async function getSwiftChartsAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const workOrderId = req.params.workOrderId as string;

    // 1. Fetch work order invoice
    let invoice = await db.query.billingInvoices.findFirst({
      where: eq(billingInvoices.workOrderId, workOrderId),
      with: { facility: true },
    });

    if (!invoice) {
      // If invoice not found by workOrderId, check by id
      invoice = await db.query.billingInvoices.findFirst({
        where: eq(billingInvoices.id, workOrderId),
        with: { facility: true },
      });
    }

    if (!invoice) {
      res.status(404).json({
        error: 'NotFound',
        message: 'No billing invoice found to generate Swift Charts telemetry from. Compile estimate first.',
      });
      return;
    }

    const subtotalLabor = parseFloat(invoice.subtotalLabor);
    const subtotalParts = parseFloat(invoice.subtotalPartsWithMarkup);
    const fleetFee = parseFloat(invoice.fleetEquipmentFee);
    const taxAmount = parseFloat(invoice.taxAmount);
    const grandTotal = parseFloat(invoice.grandTotal);

    // Calculate percentage weights for Swift Charts SectorMarks
    const laborPct = grandTotal > 0 ? +((subtotalLabor / grandTotal) * 100).toFixed(1) : 0;
    const partsPct = grandTotal > 0 ? +((subtotalParts / grandTotal) * 100).toFixed(1) : 0;
    const fleetPct = grandTotal > 0 ? +((fleetFee / grandTotal) * 100).toFixed(1) : 0;
    const taxPct = grandTotal > 0 ? +((taxAmount / grandTotal) * 100).toFixed(1) : 0;

    // 2. Fetch technician attendance breakdown for BarMark comparative metrics
    const attendanceRecords = await db.query.siteAttendance.findMany({
      where: eq(siteAttendance.workOrderId, invoice.workOrderId),
      with: {
        technician: {
          columns: { id: true, fullName: true, role: true },
        },
      },
    });

    const hourlyRate = parseFloat(invoice.hourlyLaborRateApplied);
    const technicianBreakdown = attendanceRecords.map((att) => {
      const hours = +(att.totalBillableSeconds / 3600).toFixed(2);
      return {
        technicianId: att.technicianId,
        technicianName: att.technician.fullName,
        role: att.technician.role,
        billableHours: hours,
        costContributionLkr: +(hours * hourlyRate).toFixed(2),
      };
    });

    // 3. Construct chart-ready response
    res.status(200).json({
      workOrderId: invoice.workOrderId,
      invoiceNumber: invoice.invoiceNumber,
      currency: 'LKR',
      grandTotal,
      chartMarks: [
        {
          category: 'Technician Labor',
          amount: subtotalLabor,
          percentage: laborPct,
          colorHex: '#007AFF', // iOS System Blue
        },
        {
          category: 'Approved Parts',
          amount: subtotalParts,
          percentage: partsPct,
          colorHex: '#FF9500', // iOS System Orange
        },
        {
          category: 'Fleet Equipment',
          amount: fleetFee,
          percentage: fleetPct,
          colorHex: '#5856D6', // iOS System Indigo
        },
        {
          category: 'Government Tax',
          amount: taxAmount,
          percentage: taxPct,
          colorHex: '#34C759', // iOS System Green
        },
      ],
      laborVsPartsRatio: {
        laborPercentage: laborPct,
        partsPercentage: partsPct,
      },
      summary: {
        totalLaborCost: subtotalLabor,
        totalPartsCost: subtotalParts,
        fleetFee,
        taxAmount,
        grandTotal,
        billableLaborHours: parseFloat(invoice.totalBillableLaborHours),
        hourlyLaborRateApplied: hourlyRate,
        partsMarkupPercentApplied: parseFloat(invoice.partsMarkupPercentApplied),
        invoiceStatus: invoice.status,
      },
      technicianBreakdown,
    });
  } catch (error) {
    console.error('[ANALYTICS ERROR] Swift charts telemetry generation failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to generate Swift Charts telemetry.',
    });
  }
}
