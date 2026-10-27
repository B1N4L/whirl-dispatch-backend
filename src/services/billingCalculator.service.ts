import { db } from '../config/db';
import {
  workOrders,
  siteAttendance,
  expenseClaims,
  clientFacilities,
} from '../db/schema/index';
import { eq, and } from 'drizzle-orm';

export interface LaborBreakdownItem {
  technicianId: string;
  technicianName: string;
  role: string;
  hourlyRate: number;
  billableHours: number;
  subtotal: number;
}

export interface BillingCalculationResult {
  workOrderId: string;
  clientFacilityId: string;
  totalBillableLaborHours: number;
  hourlyLaborRateApplied: number;
  subtotalLabor: number;
  laborBreakdown: LaborBreakdownItem[];
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
  workOrderId: string,
  partsMarkupOverride?: number
): Promise<BillingCalculationResult> {
  // 1. Fetch work order with facility, lead technician, assignments, and assigned fleet
  const workOrder = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, workOrderId),
    with: {
      facility: true,
      fleetAsset: true,
      leadTechnician: true,
      assignments: {
        with: {
          technician: true,
        },
      },
    },
  });

  if (!workOrder) {
    throw new Error(`Work order '${workOrderId}' not found.`);
  }

  // 2. Fetch site attendance records with technician details
  const attendanceSessions = await db.query.siteAttendance.findMany({
    where: eq(siteAttendance.workOrderId, workOrderId),
    with: {
      technician: true,
    },
  });

  // Group verified billable seconds by individual technician
  const techMap = new Map<string, {
    name: string;
    role: string;
    hourlyRate: number;
    seconds: number;
  }>();

  for (const session of attendanceSessions) {
    const techId = session.technicianId;
    const tech = session.technician;
    const rate = parseFloat(tech?.hourlyLaborRate || '60.00');
    const existing = techMap.get(techId) || {
      name: tech?.fullName || 'Technician',
      role: tech?.role || 'TECHNICIAN',
      hourlyRate: rate,
      seconds: 0,
    };
    existing.seconds += session.totalBillableSeconds || 0;
    techMap.set(techId, existing);
  }

  const laborBreakdown: LaborBreakdownItem[] = [];
  let totalBillableLaborHours = 0;
  let subtotalLabor = 0;

  if (techMap.size > 0 && Array.from(techMap.values()).some((t) => t.seconds > 0)) {
    for (const [techId, data] of techMap.entries()) {
      const hours = +(data.seconds / 3600).toFixed(2);
      const sub = +(hours * data.hourlyRate).toFixed(2);
      totalBillableLaborHours += hours;
      subtotalLabor += sub;
      laborBreakdown.push({
        technicianId: techId,
        technicianName: data.name,
        role: data.role,
        hourlyRate: data.hourlyRate,
        billableHours: hours,
        subtotal: sub,
      });
    }
    totalBillableLaborHours = +totalBillableLaborHours.toFixed(2);
    subtotalLabor = +subtotalLabor.toFixed(2);
  } else {
    // Option B Fallback: Use Lead Technician fixed hourly rate with baseline 2.5 hours
    const leadTech = workOrder.leadTechnician;
    const leadRate = parseFloat(leadTech?.hourlyLaborRate || '85.00');
    const defaultHours = 2.5;
    const leadSub = +(defaultHours * leadRate).toFixed(2);

    laborBreakdown.push({
      technicianId: workOrder.leadTechnicianId,
      technicianName: leadTech?.fullName || 'Lead Technician',
      role: leadTech?.role || 'LEAD_TECHNICIAN',
      hourlyRate: leadRate,
      billableHours: defaultHours,
      subtotal: leadSub,
    });

    totalBillableLaborHours = defaultHours;
    subtotalLabor = leadSub;
  }

  // 3. Effective blended hourly rate applied
  const hourlyLaborRateApplied = totalBillableLaborHours > 0
    ? +(subtotalLabor / totalBillableLaborHours).toFixed(2)
    : 85.00;

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

  // Apply markup: payment clerk override or facility contract default
  const facilityMarkup = parseFloat(workOrder.facility.partsMarkupPercent) || 15.0;
  const partsMarkupPercent = typeof partsMarkupOverride === 'number' && partsMarkupOverride >= 0
    ? partsMarkupOverride
    : facilityMarkup;
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
    hourlyLaborRateApplied,
    subtotalLabor,
    laborBreakdown,
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
