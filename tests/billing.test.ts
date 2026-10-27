import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Payment Clerk Cost Estimation, Invoicing & Swift Charts Telemetry APIs', () => {
  let clerkToken: string;
  let supervisorToken: string;
  let leadTechToken: string;
  let techToken: string;
  let facilityId: string;
  let facilityLat: number;
  let facilityLng: number;
  let fleetAssetId: string;
  let workOrderId: string;
  let invoiceId: string;

  it(
    'Setup: Authenticate users, get facilities/fleet, create work order and attendance',
    async () => {
    // 1. Payment Clerk login (Anusha)
    const clerkLogin = await request(app).post('/api/auth/login').send({
      email: 'anusha.clerk@whirldispatch.com',
      password: 'password123',
    });
    clerkToken = clerkLogin.body.token;

    // 2. Supervisor login (Sarath)
    const supLogin = await request(app).post('/api/auth/login').send({
      email: 'sarath.supervisor@whirldispatch.com',
      password: 'password123',
    });
    supervisorToken = supLogin.body.token;

    // 3. Lead Tech login (Kasun)
    const leadLogin = await request(app).post('/api/auth/login').send({
      email: 'kasun.lead@whirldispatch.com',
      password: 'password123',
    });
    leadTechToken = leadLogin.body.token;

    // 4. Standard Tech login (Dinesh)
    const techLogin = await request(app).post('/api/auth/login').send({
      email: 'dinesh.tech@whirldispatch.com',
      password: 'password123',
    });
    techToken = techLogin.body.token;

    // 5. Fetch facility and fleet vehicle
    const facRes = await request(app)
      .get('/api/facilities')
      .set('Authorization', `Bearer ${supervisorToken}`);
    facilityId = facRes.body.facilities[0].id;
    facilityLat = facRes.body.facilities[0].latitude;
    facilityLng = facRes.body.facilities[0].longitude;

    const fleetRes = await request(app)
      .get('/api/fleet')
      .set('Authorization', `Bearer ${supervisorToken}`);
    fleetAssetId = fleetRes.body.fleet[0].id;

    // 6. Create work order with vehicle
    const woRes = await request(app)
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        clientFacilityId: facilityId,
        leadTechnicianId: leadLogin.body.user.id,
        assignedFleetAssetId: fleetAssetId,
        assignedTechnicianIds: [],
        title: 'Commercial HVAC Quarterly Invoicing Audit',
        description: 'Scheduled preventive overhaul requiring labor, parts, and vehicle fee calculations.',
        priority: 'HIGH',
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 18000000).toISOString(),
      });
    expect(woRes.status).toBe(201);
    workOrderId = woRes.body.workOrder.id;

    // 7. Lead tech clocks in and out to record attendance
    await request(app)
      .post('/api/attendance/clock-in')
      .set('Authorization', `Bearer ${leadTechToken}`)
      .send({
        workOrderId,
        latitude: facilityLat,
        longitude: facilityLng,
        accuracyMeters: 5.0,
        biometricVerified: true,
      });

    await request(app)
      .post('/api/attendance/clock-out')
      .set('Authorization', `Bearer ${leadTechToken}`)
      .send({
        workOrderId,
        latitude: facilityLat,
        longitude: facilityLng,
        accuracyMeters: 5.0,
      });

    // 8. Lead tech submits parts expense and supervisor approves
    const expRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${leadTechToken}`)
      .send({
        workOrderId,
        vendorName: 'Singer Commercial HVAC Depot',
        receiptNumber: 'REC-SNG-8812',
        currency: 'LKR',
        receiptImageUrl: 'https://storage.whirldispatch.com/receipts/rec-parts-01.jpg',
        receiptStoreLatitude: facilityLat,
        receiptStoreLongitude: facilityLng,
        items: [
          {
            partDescription: 'R410A Refrigerant Canister 11.3kg',
            quantity: 1,
            unitPrice: 10000,
          },
        ],
      });
    expect(expRes.status).toBe(201);
    const claimId = expRes.body.claim.id;

    const aprRes = await request(app)
      .patch(`/api/expenses/${claimId}/review`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        approvalStatus: 'APPROVED',
      });
    expect(aprRes.status).toBe(200);
  }, 30000);

  describe('RBAC & Automated Cost Estimation Calculation', () => {
    it('POST /api/billing/estimate/:workOrderId should forbid field technicians', async () => {
      const res = await request(app)
        .post(`/api/billing/estimate/${workOrderId}`)
        .set('Authorization', `Bearer ${techToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('POST /api/billing/estimate/:workOrderId should allow Payment Clerk to compile official estimate', async () => {
      const res = await request(app)
        .post(`/api/billing/estimate/${workOrderId}`)
        .set('Authorization', `Bearer ${clerkToken}`);

      expect(res.status).toBe(201);
      expect(res.body.invoice).toBeDefined();

      const inv = res.body.invoice;
      expect(inv.invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);
      expect(inv.status).toBe('DRAFT_ESTIMATE');

      // Verify formula components
      const subtotalApprovedParts = parseFloat(inv.subtotalApprovedParts);
      expect(subtotalApprovedParts).toBe(10000);

      const partsMarkup = parseFloat(inv.partsMarkupPercentApplied);
      const subtotalPartsWithMarkup = parseFloat(inv.subtotalPartsWithMarkup);
      expect(subtotalPartsWithMarkup).toBe(+(subtotalApprovedParts * (1 + partsMarkup / 100)).toFixed(2));

      // Fleet fee was assigned
      const fleetFee = parseFloat(inv.fleetEquipmentFee);
      expect(fleetFee).toBe(3500);

      // Tax 8%
      const labor = parseFloat(inv.subtotalLabor);
      const subtotalBeforeTax = labor + subtotalPartsWithMarkup + fleetFee;
      const expectedTax = +(subtotalBeforeTax * 0.08).toFixed(2);
      expect(parseFloat(inv.taxAmount)).toBeCloseTo(expectedTax, 1);

      // Grand total
      expect(parseFloat(inv.grandTotal)).toBeCloseTo(subtotalBeforeTax + expectedTax, 1);

      invoiceId = inv.id;
    });

    it('POST /api/billing/estimate/:workOrderId should be idempotent and update without duplicate records', async () => {
      const res = await request(app)
        .post(`/api/billing/estimate/${workOrderId}`)
        .set('Authorization', `Bearer ${clerkToken}`);

      expect(res.status).toBe(200);
      expect(res.body.invoice.id).toBe(invoiceId);
    });

    it('GET /api/billing/estimate/:workOrderId should allow previewing calculation with labor breakdown', async () => {
      const res = await request(app)
        .get(`/api/billing/estimate/${workOrderId}`)
        .set('Authorization', `Bearer ${clerkToken}`);

      expect(res.status).toBe(200);
      expect(res.body.calculation).toBeDefined();
      expect(res.body.calculation.laborBreakdown).toBeInstanceOf(Array);
      expect(res.body.calculation.laborBreakdown.length).toBeGreaterThan(0);
      expect(res.body.calculation.laborBreakdown[0].role).toBeDefined();
      expect(res.body.calculation.laborBreakdown[0].hourlyRate).toBeGreaterThan(0);
    });
  });

  describe('Invoice Status Lifecycle & Work Order Sync', () => {
    it('GET /api/billing/invoices/:id should return complete invoice with facility and clerk details', async () => {
      const res = await request(app)
        .get(`/api/billing/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${clerkToken}`);

      expect(res.status).toBe(200);
      expect(res.body.invoice).toBeDefined();
      expect(res.body.invoice.facility).toBeDefined();
      expect(res.body.invoice.clerk.role).toBe('PAYMENT_CLERK');
    });

    it('PATCH /api/billing/invoices/:id/status should update status to ISSUED_TO_CLIENT and sync work order to BILLED', async () => {
      const res = await request(app)
        .patch(`/api/billing/invoices/${invoiceId}/status`)
        .set('Authorization', `Bearer ${clerkToken}`)
        .send({
          status: 'ISSUED_TO_CLIENT',
        });

      expect(res.status).toBe(200);
      expect(res.body.invoice.status).toBe('ISSUED_TO_CLIENT');

      // Verify work order state transitioned to BILLED
      const woCheck = await request(app)
        .get(`/api/work-orders/${workOrderId}`)
        .set('Authorization', `Bearer ${clerkToken}`);

      expect(woCheck.body.workOrder.status).toBe('BILLED');
    });
  });

  describe('Swift Charts Financial Telemetry Feed', () => {
    it('GET /api/billing/analytics/:workOrderId should return structured marks and ratios for iOS Swift Charts', async () => {
      const res = await request(app)
        .get(`/api/billing/analytics/${workOrderId}`)
        .set('Authorization', `Bearer ${clerkToken}`);

      expect(res.status).toBe(200);
      expect(res.body.chartMarks).toBeDefined();
      expect(res.body.chartMarks.length).toBe(4);

      // Verify categories
      const categories = res.body.chartMarks.map((m: any) => m.category);
      expect(categories).toContain('Technician Labor');
      expect(categories).toContain('Approved Parts');
      expect(categories).toContain('Fleet Equipment');
      expect(categories).toContain('Government Tax');

      // Verify percentage totals
      const totalPercentage = res.body.chartMarks.reduce((acc: number, m: any) => acc + m.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);

      // Verify colorHex codes for iOS rendering
      expect(res.body.chartMarks[0].colorHex).toMatch(/^#[0-9A-Fa-f]{6}$/);

      // Verify ratio
      expect(res.body.laborVsPartsRatio).toBeDefined();
      expect(res.body.summary).toBeDefined();
    });
  });
});
