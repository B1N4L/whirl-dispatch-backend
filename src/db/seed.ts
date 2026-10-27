import bcrypt from 'bcrypt';
import { unpooledDb } from '../config/db';
import {
  users,
  clientFacilities,
  fleetAssets,
  workOrders,
  workOrderAssignments,
  siteAttendance,
  diagnosticDossiers,
  checklistItems,
  expenseClaims,
  expenseItems,
  billingInvoices,
} from './schema/index';
import { eq, sql } from 'drizzle-orm';

async function seed() {
  console.log('[SEED] Initializing WhirlDispatch database seeder via unpooled connection...');

  // Reset all database tables for a fresh, clean state
  console.log('[SEED] Resetting database tables for fresh clean state...');
  await unpooledDb.execute(sql`
    TRUNCATE TABLE
      billing_invoices,
      expense_items,
      expense_claims,
      checklist_items,
      diagnostic_dossiers,
      geofence_audit_logs,
      site_attendance,
      system_notifications,
      work_order_assignments,
      work_orders,
      fleet_assets,
      client_facilities,
      users
    CASCADE;
  `);

  // 1. Seed Users across all operational roles with multiple Lead Technicians & Technicians
  console.log('[SEED] Seeding RBAC user accounts...');
  const saltRounds = 10;
  const defaultPasswordHash = await bcrypt.hash('password123', saltRounds);

  const sampleUsers = [
    // Supervisor
    {
      email: 'sarath.supervisor@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Sarath Bandara',
      phone: '+94 77 123 4567',
      role: 'SUPERVISOR' as const,
      hourlyLaborRate: '120.00',
      biometricEnrolled: true,
      isActive: true,
    },
    // Lead Technicians (5 field leads)
    {
      email: 'kasun.lead@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Kasun Perera',
      phone: '+94 71 234 5678',
      role: 'LEAD_TECHNICIAN' as const,
      hourlyLaborRate: '85.00',
      biometricEnrolled: true,
      isActive: true,
    },
    {
      email: 'rohan.lead@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Rohan Jayawardena',
      phone: '+94 77 234 5678',
      role: 'LEAD_TECHNICIAN' as const,
      hourlyLaborRate: '90.00',
      biometricEnrolled: true,
      isActive: true,
    },
    {
      email: 'chaminda.lead@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Chaminda Wickramasinghe',
      phone: '+94 71 345 6789',
      role: 'LEAD_TECHNICIAN' as const,
      hourlyLaborRate: '88.00',
      biometricEnrolled: true,
      isActive: true,
    },
    {
      email: 'tharindu.lead@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Tharindu Alwis',
      phone: '+94 72 456 7890',
      role: 'LEAD_TECHNICIAN' as const,
      hourlyLaborRate: '85.00',
      biometricEnrolled: true,
      isActive: true,
    },
    {
      email: 'sanjeewa.lead@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Sanjeewa Kumara',
      phone: '+94 77 567 8901',
      role: 'LEAD_TECHNICIAN' as const,
      hourlyLaborRate: '82.00',
      biometricEnrolled: true,
      isActive: true,
    },
    // Field Technicians (8 crew technicians)
    {
      email: 'nuwan.tech@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Nuwan Silva',
      phone: '+94 76 345 6789',
      role: 'TECHNICIAN' as const,
      hourlyLaborRate: '60.00',
      biometricEnrolled: true,
      isActive: true,
    },
    {
      email: 'dinesh.tech@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Dinesh Fernando',
      phone: '+94 75 456 7890',
      role: 'TECHNICIAN' as const,
      hourlyLaborRate: '55.00',
      biometricEnrolled: false,
      isActive: true,
    },
    {
      email: 'asanka.tech@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Asanka Senanayake',
      phone: '+94 76 678 9012',
      role: 'TECHNICIAN' as const,
      hourlyLaborRate: '62.00',
      biometricEnrolled: true,
      isActive: true,
    },
    {
      email: 'malik.tech@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Malik Gunawardena',
      phone: '+94 75 789 0123',
      role: 'TECHNICIAN' as const,
      hourlyLaborRate: '58.00',
      biometricEnrolled: true,
      isActive: true,
    },
    {
      email: 'pradeep.tech@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Pradeep Rathnayake',
      phone: '+94 78 890 1234',
      role: 'TECHNICIAN' as const,
      hourlyLaborRate: '60.00',
      biometricEnrolled: true,
      isActive: true,
    },
    {
      email: 'ravindu.tech@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Ravindu Madushanka',
      phone: '+94 71 901 2345',
      role: 'TECHNICIAN' as const,
      hourlyLaborRate: '56.00',
      biometricEnrolled: false,
      isActive: true,
    },
    {
      email: 'kavinda.tech@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Kavinda Jayasuriya',
      phone: '+94 70 012 3456',
      role: 'TECHNICIAN' as const,
      hourlyLaborRate: '58.00',
      biometricEnrolled: true,
      isActive: true,
    },
    {
      email: 'lahiru.tech@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Lahiru Dissanayake',
      phone: '+94 77 112 2334',
      role: 'TECHNICIAN' as const,
      hourlyLaborRate: '54.00',
      biometricEnrolled: true,
      isActive: true,
    },
    // Payment Clerk
    {
      email: 'anusha.clerk@whirldispatch.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Anusha Jayawardena',
      phone: '+94 70 567 8901',
      role: 'PAYMENT_CLERK' as const,
      hourlyLaborRate: '65.00',
      biometricEnrolled: true,
      isActive: true,
    },
  ];

  const seededUsers: Record<string, string> = {};

  for (const user of sampleUsers) {
    const existing = await unpooledDb.query.users.findFirst({
      where: eq(users.email, user.email),
    });

    if (existing) {
      seededUsers[user.email] = existing.id;
    } else {
      const [inserted] = await unpooledDb.insert(users).values(user).returning({ id: users.id });
      seededUsers[user.email] = inserted.id;
    }
  }

  // 2. Seed Commercial Client Facilities with real coordinates
  console.log('[SEED] Seeding commercial client facilities and contracts...');
  const sampleFacilities = [
    {
      companyName: 'Hemas Holdings PLC',
      facilityName: 'Hemas HQ Mechanical Plant Room',
      address: 'Hemas House, No. 75, Braybrooke Place, Colombo 02, Sri Lanka',
      latitude: 6.9175,
      longitude: 79.855,
      geofenceRadius: 100.0,
      contactPersonName: 'Rohan De Silva (Head of Facilities)',
      contactPhone: '+94 11 473 1731',
      contactEmail: 'rohan.facilities@hemas.com',
      contractStartDate: new Date('2026-01-01T00:00:00Z'),
      contractEndDate: new Date('2026-12-31T23:59:59Z'),
      slaResponseHours: 2,
      contractHourlyRate: '90.00',
      partsMarkupPercent: '15.00',
    },
    {
      companyName: 'World Trade Center Colombo',
      facilityName: 'WTC West Tower Basement Chiller Plant',
      address: 'Echelon Square, Lotus Rd, Colombo 01, Sri Lanka',
      latitude: 6.9338,
      longitude: 79.8433,
      geofenceRadius: 120.0,
      contactPersonName: 'Malik Fernando (Senior Chief Engineer)',
      contactPhone: '+94 11 234 6000',
      contactEmail: 'm.fernando@wtc.lk',
      contractStartDate: new Date('2025-06-01T00:00:00Z'),
      contractEndDate: new Date('2027-05-31T23:59:59Z'),
      slaResponseHours: 2,
      contractHourlyRate: '110.00',
      partsMarkupPercent: '20.00',
    },
    {
      companyName: 'Cinnamon Grand Hotel',
      facilityName: 'Cinnamon Grand AHU & Cooling Tower Roof Plant',
      address: '77 Galle Rd, Colombo 03, Sri Lanka',
      latitude: 6.9189,
      longitude: 79.8475,
      geofenceRadius: 100.0,
      contactPersonName: 'Chandana Alwis (Maintenance Director)',
      contactPhone: '+94 11 243 7437',
      contactEmail: 'c.alwis@cinnamonhotels.com',
      contractStartDate: new Date('2026-03-01T00:00:00Z'),
      contractEndDate: new Date('2027-02-28T23:59:59Z'),
      slaResponseHours: 4,
      contractHourlyRate: '85.00',
      partsMarkupPercent: '15.00',
    },
    {
      companyName: 'Dialog Axiata PLC',
      facilityName: 'Dialog Axiata Data Center Plant Room',
      address: '475 Union Place, Colombo 02, Sri Lanka',
      latitude: 6.9180,
      longitude: 79.8620,
      geofenceRadius: 100.0,
      contactPersonName: 'Sunil Perera (Data Center Facilities Lead)',
      contactPhone: '+94 11 710 0100',
      contactEmail: 'sunil.p@dialog.lk',
      contractStartDate: new Date('2026-01-01T00:00:00Z'),
      contractEndDate: new Date('2027-12-31T23:59:59Z'),
      slaResponseHours: 2,
      contractHourlyRate: '95.00',
      partsMarkupPercent: '18.00',
    },
    {
      companyName: 'Cargills (Ceylon) PLC',
      facilityName: 'Cargills Central Logistics Hub Chiller Room',
      address: '40 York Street, Colombo 01, Sri Lanka',
      latitude: 6.9350,
      longitude: 79.8430,
      geofenceRadius: 150.0,
      contactPersonName: 'Ruwan Jayasuriya (Cold Chain Operations)',
      contactPhone: '+94 11 242 7777',
      contactEmail: 'ruwan.j@cargillsceylon.com',
      contractStartDate: new Date('2026-02-01T00:00:00Z'),
      contractEndDate: new Date('2027-01-31T23:59:59Z'),
      slaResponseHours: 2,
      contractHourlyRate: '88.00',
      partsMarkupPercent: '16.00',
    },
  ];

  const seededFacilities: Record<string, string> = {};

  for (const facility of sampleFacilities) {
    const existing = await unpooledDb.query.clientFacilities.findFirst({
      where: eq(clientFacilities.facilityName, facility.facilityName),
    });

    if (existing) {
      seededFacilities[facility.facilityName] = existing.id;
    } else {
      const [inserted] = await unpooledDb.insert(clientFacilities).values(facility).returning({ id: clientFacilities.id });
      seededFacilities[facility.facilityName] = inserted.id;
    }
  }

  // 3. Seed Fleet Assets and service vehicles
  console.log('[SEED] Seeding fleet assets and heavy equipment...');
  const sampleFleet = [
    {
      assetCode: 'VAN-04',
      name: 'Toyota HiAce Field Service Van #04',
      assetType: 'VAN' as const,
      licensePlate: 'WP-CAA-4404',
      status: 'AVAILABLE' as const,
    },
    {
      assetCode: 'CRANE-02',
      name: 'Tadano 15-Ton Mobile Crane Truck #02',
      assetType: 'CRANE_TRUCK' as const,
      licensePlate: 'WP-DA-8902',
      status: 'AVAILABLE' as const,
    },
    {
      assetCode: 'VAN-07',
      name: 'Nissan Caravan Mobile Diagnostics Unit #07',
      assetType: 'SERVICE_TRUCK' as const,
      licensePlate: 'WP-CAB-7707',
      status: 'AVAILABLE' as const,
    },
    {
      assetCode: 'VAN-11',
      name: 'Toyota HiAce Commuter Service Van #11',
      assetType: 'VAN' as const,
      licensePlate: 'WP-CAC-1111',
      status: 'AVAILABLE' as const,
    },
    {
      assetCode: 'TRUCK-05',
      name: 'Isuzu Elf 5-Ton Refrigerant Recovery Truck #05',
      assetType: 'SERVICE_TRUCK' as const,
      licensePlate: 'WP-LB-5005',
      status: 'AVAILABLE' as const,
    },
    {
      assetCode: 'TRAILER-01',
      name: 'Heavy Duty Chiller Rigging Trailer #01',
      assetType: 'RECOVERY_TRAILER' as const,
      licensePlate: 'WP-TR-7001',
      status: 'AVAILABLE' as const,
    },
  ];

  const seededFleet: Record<string, string> = {};

  for (const asset of sampleFleet) {
    const existing = await unpooledDb.query.fleetAssets.findFirst({
      where: eq(fleetAssets.assetCode, asset.assetCode),
    });

    if (existing) {
      seededFleet[asset.assetCode] = existing.id;
    } else {
      const [inserted] = await unpooledDb.insert(fleetAssets).values(asset).returning({ id: fleetAssets.id });
      seededFleet[asset.assetCode] = inserted.id;
    }
  }

  // 4. Seed Sample Work Orders across various lifecycle stages
  console.log('[SEED] Seeding sample work orders and dispatches...');
  const supervisorId = seededUsers['sarath.supervisor@whirldispatch.com'];
  const lead1Id = seededUsers['kasun.lead@whirldispatch.com'];
  const lead2Id = seededUsers['rohan.lead@whirldispatch.com'];
  const lead3Id = seededUsers['chaminda.lead@whirldispatch.com'];
  const lead4Id = seededUsers['tharindu.lead@whirldispatch.com'];

  const tech1Id = seededUsers['nuwan.tech@whirldispatch.com'];
  const tech2Id = seededUsers['dinesh.tech@whirldispatch.com'];
  const tech3Id = seededUsers['asanka.tech@whirldispatch.com'];
  const tech4Id = seededUsers['malik.tech@whirldispatch.com'];
  const tech5Id = seededUsers['pradeep.tech@whirldispatch.com'];
  const tech6Id = seededUsers['ravindu.tech@whirldispatch.com'];
  const clerkId = seededUsers['anusha.clerk@whirldispatch.com'];

  const sampleWorkOrders = [
    // Completed work order with full diagnostic dossier, receipts, and invoice
    {
      workOrderNumber: 'WO-2026-0001',
      clientFacilityId: seededFacilities['Hemas HQ Mechanical Plant Room'],
      supervisorId,
      leadTechnicianId: lead1Id,
      assignedFleetAssetId: seededFleet['VAN-04'],
      title: 'York Centrifugal Chiller High Pressure Lockout',
      description: 'Emergency breakdown: Primary York Centrifugal Chiller tripped on high head pressure. Plant room ambient temperature rising rapidly.',
      priority: 'CRITICAL_EMERGENCY' as const,
      status: 'COMPLETED' as const,
      scheduledStartTime: new Date('2026-10-04T09:00:00Z'),
      scheduledEndTime: new Date('2026-10-04T15:00:00Z'),
      actualStartTime: new Date('2026-10-04T09:15:00Z'),
      actualEndTime: new Date('2026-10-04T14:45:00Z'),
      crew: [tech1Id, tech2Id],
    },
    // Active on-site work order with live attendance session
    {
      workOrderNumber: 'WO-2026-0002',
      clientFacilityId: seededFacilities['WTC West Tower Basement Chiller Plant'],
      supervisorId,
      leadTechnicianId: lead2Id,
      assignedFleetAssetId: seededFleet['CRANE-02'],
      title: 'Trane Series R Helical Rotary Condenser Coil Overhaul',
      description: 'Scheduled quarterly descaling of shell-and-tube condensers and inspection of 415V variable frequency drive contacts.',
      priority: 'HIGH' as const,
      status: 'ON_SITE_ACTIVE' as const,
      scheduledStartTime: new Date('2026-10-27T08:00:00Z'),
      scheduledEndTime: new Date('2026-10-27T16:00:00Z'),
      actualStartTime: new Date('2026-10-27T08:30:00Z'),
      crew: [tech3Id, tech4Id],
    },
    // En-route emergency work order
    {
      workOrderNumber: 'WO-2026-0003',
      clientFacilityId: seededFacilities['Cinnamon Grand AHU & Cooling Tower Roof Plant'],
      supervisorId,
      leadTechnicianId: lead3Id,
      assignedFleetAssetId: seededFleet['VAN-07'],
      title: 'Carrier AquaForce 30XA Chiller Refrigerant Leak Isolation',
      description: 'Critical emergency: Low suction pressure trip triggered on Circuit A. Leak isolation and electronic sniffing required immediately.',
      priority: 'CRITICAL_EMERGENCY' as const,
      status: 'EN_ROUTE' as const,
      scheduledStartTime: new Date('2026-10-27T10:00:00Z'),
      scheduledEndTime: new Date('2026-10-27T14:00:00Z'),
      actualStartTime: new Date('2026-10-27T10:15:00Z'),
      crew: [tech5Id],
    },
    // Dispatched scheduled work order
    {
      workOrderNumber: 'WO-2026-0004',
      clientFacilityId: seededFacilities['Dialog Axiata Data Center Plant Room'],
      supervisorId,
      leadTechnicianId: lead4Id,
      assignedFleetAssetId: seededFleet['TRUCK-05'],
      title: 'Precision Air Handling Unit Blower Belt Replacement',
      description: 'Server Room 03 precision AHU blower fan belt frayed and slipping. Static pressure below 120 Pa.',
      priority: 'MEDIUM' as const,
      status: 'DISPATCHED' as const,
      scheduledStartTime: new Date('2026-10-27T14:00:00Z'),
      scheduledEndTime: new Date('2026-10-27T18:00:00Z'),
      crew: [tech6Id],
    },
  ];

  for (const wo of sampleWorkOrders) {
    const existing = await unpooledDb.query.workOrders.findFirst({
      where: eq(workOrders.workOrderNumber, wo.workOrderNumber),
    });

    let woId = existing?.id;

    if (!existing) {
      const [inserted] = await unpooledDb
        .insert(workOrders)
        .values({
          workOrderNumber: wo.workOrderNumber,
          clientFacilityId: wo.clientFacilityId,
          supervisorId: wo.supervisorId,
          leadTechnicianId: wo.leadTechnicianId,
          assignedFleetAssetId: wo.assignedFleetAssetId,
          title: wo.title,
          description: wo.description,
          priority: wo.priority,
          status: wo.status,
          scheduledStartTime: wo.scheduledStartTime,
          scheduledEndTime: wo.scheduledEndTime,
          actualStartTime: wo.actualStartTime ?? null,
          actualEndTime: wo.actualEndTime ?? null,
        })
        .returning({ id: workOrders.id });

      woId = inserted.id;

      // Assign team crew members
      if (wo.crew && wo.crew.length > 0) {
        await unpooledDb.insert(workOrderAssignments).values(
          wo.crew.map((techId) => ({
            workOrderId: woId!,
            technicianId: techId,
          }))
        );
      }
    }

    // Active attendance session for WO-2026-0002
    if (wo.workOrderNumber === 'WO-2026-0002' && woId) {
      await unpooledDb.insert(siteAttendance).values({
        workOrderId: woId,
        technicianId: lead2Id,
        clockInTimestamp: new Date('2026-10-27T08:30:00Z'),
        clockOutTimestamp: null,
        totalBillableSeconds: 7200,
        totalBreakSeconds: 600,
        sessionStatus: 'ACTIVE_ON_SITE',
      });
    }

    // 5. Seed Diagnostic Dossier for Completed WO-2026-0001
    if (wo.workOrderNumber === 'WO-2026-0001' && woId) {
      const existingDossier = await unpooledDb.query.diagnosticDossiers.findFirst({
        where: eq(diagnosticDossiers.workOrderId, woId),
      });

      if (!existingDossier) {
        console.log('[SEED] Seeding diagnostic dossier and inspection checklist...');
        const [dossier] = await unpooledDb
          .insert(diagnosticDossiers)
          .values({
            workOrderId: woId,
            leadTechnicianId: lead1Id,
            equipmentModel: 'York YK Centrifugal Liquid Chiller 500TR',
            equipmentSerialNumber: 'YK-500-SR-2019-041',
            baselineSuctionPressurePsi: '48.50',
            postServiceSuctionPressurePsi: '62.00',
            baselineDischargePressurePsi: '285.00',
            postServiceDischargePressurePsi: '210.00',
            baselineMotorRunningAmps: '420.00',
            postServiceMotorRunningAmps: '345.00',
            baselineCoilTempDifferential: '4.20',
            postServiceCoilTempDifferential: '10.80',
            diagnosticNotes:
              'Found condenser water strainer clogged with heavy bio-fouling and scale. Cleaned strainers, back-flushed shell-and-tube heat exchanger, reset high pressure manual limit.',
            isCompleted: true,
            completedAt: new Date('2026-10-04T14:30:00Z'),
          })
          .returning({ id: diagnosticDossiers.id });

        // Add Categorized Checklist Items
        await unpooledDb.insert(checklistItems).values([
          {
            diagnosticDossierId: dossier.id,
            category: 'COMPRESSOR_SYSTEM',
            itemLabel: 'Check compressor oil level and differential pressure',
            isChecked: true,
            notes: 'Oil level at 65% sight glass, nominal pressure confirmed.',
          },
          {
            diagnosticDossierId: dossier.id,
            category: 'REFRIGERANT_CIRCUIT',
            itemLabel: 'Inspect moisture indicator sight glass for acid/dry status',
            isChecked: true,
            notes: 'Color indicates dry circuit.',
          },
          {
            diagnosticDossierId: dossier.id,
            category: 'ELECTRICAL_CONTROLS',
            itemLabel: 'Measure terminal contactor voltage drop and tight coil connections',
            isChecked: true,
            notes: 'Contactor points cleaned and torqued.',
          },
          {
            diagnosticDossierId: dossier.id,
            category: 'CONDENSER_AIR_FLOW',
            itemLabel: 'Inspect water flow switch differential and condenser pump GPM',
            isChecked: true,
            notes: 'Differential restored to 12.5 PSI across bundle.',
          },
        ]);
      }

      // 6. Seed Sample Expense Claim & Approved Receipts
      const existingExpense = await unpooledDb.query.expenseClaims.findFirst({
        where: eq(expenseClaims.workOrderId, woId),
      });

      if (!existingExpense) {
        console.log('[SEED] Seeding verified field expense claims and receipt metadata...');
        const [expense] = await unpooledDb
          .insert(expenseClaims)
          .values({
            workOrderId: woId,
            leadTechnicianId: lead1Id,
            vendorName: 'Lanka Copper & AC Fittings Ltd',
            receiptNumber: 'REC-LK-90412',
            totalAmount: '18500.00',
            currency: 'LKR',
            receiptImageUrl: 'https://storage.whirldispatch.com/receipts/wo-0001-strainer-seal.jpg',
            receiptStoreLatitude: 6.919,
            receiptStoreLongitude: 79.856,
            receiptCapturedAt: new Date('2026-10-04T11:30:00Z'),
            isThresholdExceeded: false,
            approvalStatus: 'APPROVED',
            reviewedBySupervisorId: supervisorId,
            reviewedAt: new Date('2026-10-04T12:05:00Z'),
          })
          .returning({ id: expenseClaims.id });

        await unpooledDb.insert(expenseItems).values([
          {
            expenseClaimId: expense.id,
            partDescription: 'EPDM Heat Exchanger Flange Gasket Set 6-inch',
            quantity: 2,
            unitPrice: '4500.00',
            totalPrice: '9000.00',
          },
          {
            expenseClaimId: expense.id,
            partDescription: 'Heavy Duty Stainless Steel Y-Strainer Screen Replacement',
            quantity: 1,
            unitPrice: '9500.00',
            totalPrice: '9500.00',
          },
        ]);
      }

      // 7. Seed Sample Billing Invoice for Work Order 1
      const existingInvoice = await unpooledDb.query.billingInvoices.findFirst({
        where: eq(billingInvoices.workOrderId, woId),
      });

      if (!existingInvoice) {
        console.log('[SEED] Seeding itemized client billing invoice and financial summary...');
        await unpooledDb.insert(billingInvoices).values({
          invoiceNumber: 'INV-2026-0001',
          workOrderId: woId,
          clientFacilityId: seededFacilities['Hemas HQ Mechanical Plant Room'],
          clerkId: clerkId,
          totalBillableLaborHours: '5.50',
          hourlyLaborRateApplied: '90.00',
          subtotalLabor: '495.00',
          subtotalApprovedParts: '18500.00',
          partsMarkupPercentApplied: '15.00',
          subtotalPartsWithMarkup: '21275.00',
          fleetEquipmentFee: '50.00',
          taxPercent: '8.00',
          taxAmount: '1746.00',
          grandTotal: '23566.00',
          status: 'APPROVED_BY_SUPERVISOR',
          issueDate: new Date('2026-10-04T16:00:00Z'),
          dueDate: new Date('2026-11-04T00:00:00Z'),
        });
      }
    }
  }

  console.log('[SEED] Database seeding completed successfully.');
}

seed()
  .then(() => {
    console.log('[SEED] Process finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[SEED ERROR] Seeding failed:', err);
    process.exit(1);
  });
