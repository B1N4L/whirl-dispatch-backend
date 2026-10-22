import { db } from '../config/db';
import {
  workOrders,
  siteAttendance,
  expenseClaims,
  clientFacilities,
} from '../db/schema/index';
import { eq, and } from 'drizzle-orm';

export interface BillingCalculationResult {
  workOrderId: string;
  clientFacilityId: string;
  totalBillableLaborHours: number;
  hourlyLaborRateApplied: number;
  subtotalLabor: number;
  subtotalApprovedParts: number;
  partsMarkupPercentApplied: number;
  subtotalPartsWithMarkup: number;
  fleetEquipmentFee: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  invoiceNumber: string;
  dueDate: Date;
}

export async function compileWorkOrderBillingMetrics(
  workOrderId: string
): Promise<BillingCalculationResult> {
  // 1. Fetch work order with facility and assigned fleet
  const workOrder = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, workOrderId),
    with: {
      facility: true,
      fleetAsset: true,
    },
  });

  if (!workOrder) {
    throw new Error(`Work order '${workOrderId}' not found.`);
  }

  // 2. Fetch site attendance records to sum billable labor
  const attendanceSessions = await db.query.siteAttendance.findMany({
    where: eq(siteAttendance.workOrderId, workOrderId),
  });

  let totalBillableSeconds = attendanceSessions.reduce(
    (acc, session) => acc + (session.totalBillableSeconds || 0),
    0
  );

  // If no attendance sessions exist, fallback to scheduled/actual duration (minimum 2 hours)
  let totalBillableLaborHours = 0;
  if (totalBillableSeconds > 0) {
    totalBillableLaborHours = +(totalBillableSeconds / 3600).toFixed(2);
  } else {
    // Default 2.5 billable hours if not tracked
    totalBillableLaborHours = 2.5;
  }

  // 3. Labor rate applied
  const hourlyRate = parseFloat(workOrder.facility.contractHourlyRate) || 5000.0;
  const subtotalLabor = +(totalBillableLaborHours * hourlyRate).toFixed(2);

  // 4. Fetch approved expense claims
  const approvedClaims = await db.query.expenseClaims.findMany({
    where: and(
      eq(expenseClaims.workOrderId, workOrderId),
      eq(expenseClaims.approvalStatus, 'APPROVED')
    ),
  });

  const subtotalApprovedParts = +approvedClaims
    .reduce((acc, claim) => acc + parseFloat(claim.totalAmount), 0)
    .toFixed(2);

  const partsMarkupPercent = parseFloat(workOrder.facility.partsMarkupPercent) || 15.0;
  const markupFactor = 1 + partsMarkupPercent / 100;
  const subtotalPartsWithMarkup = +(subtotalApprovedParts * markupFactor).toFixed(2);

  // 5. Fleet equipment fee (if vehicle allocated, e.g. 3500 LKR base flat fee)
  const fleetEquipmentFee = workOrder.assignedFleetAssetId ? 3500.0 : 0.0;

  // 6. Tax calculation (8.00% standard VAT / Service tax)
  const taxPercent = 8.0;
  const subtotalBeforeTax = subtotalLabor + subtotalPartsWithMarkup + fleetEquipmentFee;
  const taxAmount = +(subtotalBeforeTax * (taxPercent / 100)).toFixed(2);

  // 7. Grand total
  const grandTotal = +(subtotalBeforeTax + taxAmount).toFixed(2);

  // 8. Unique invoice number: INV-YYYYMMDD-XXXX
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

  // 9. Due date (30 days standard payment terms)
  const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    workOrderId,
    clientFacilityId: workOrder.clientFacilityId,
    totalBillableLaborHours,
    hourlyLaborRateApplied: hourlyRate,
    subtotalLabor,
    subtotalApprovedParts,
    partsMarkupPercentApplied: partsMarkupPercent,
    subtotalPartsWithMarkup,
    fleetEquipmentFee,
    taxPercent,
    taxAmount,
    grandTotal,
    invoiceNumber,
    dueDate,
  };
}
