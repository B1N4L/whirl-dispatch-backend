import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Field Expense Ledger & Receipt Audit Pipeline APIs', () => {
  let supervisorToken: string;
  let leadTechToken: string;
  let leadTechId: string;
  let unassignedTechToken: string;
  let facilityId: string;
  let workOrderId: string;
  let standardClaimId: string;
  let highValueClaimId: string;

  it('Setup: Authenticate users, get facility, and create maintenance work order', async () => {
    // 1. Supervisor login
    const supLogin = await request(app).post('/api/auth/login').send({
      email: 'sarath.supervisor@whirldispatch.com',
      password: 'password123',
    });
    supervisorToken = supLogin.body.token;

    // 2. Lead Tech login (Kasun)
    const leadLogin = await request(app).post('/api/auth/login').send({
      email: 'kasun.lead@whirldispatch.com',
      password: 'password123',
    });
    leadTechToken = leadLogin.body.token;
    leadTechId = leadLogin.body.user.id;

    // 3. Unassigned Tech login (Dinesh)
    const unassignedLogin = await request(app).post('/api/auth/login').send({
      email: 'dinesh.tech@whirldispatch.com',
      password: 'password123',
    });
    unassignedTechToken = unassignedLogin.body.token;

    // 4. Fetch facility
    const facRes = await request(app)
      .get('/api/facilities')
      .set('Authorization', `Bearer ${supervisorToken}`);
    facilityId = facRes.body.facilities[0].id;

    // 5. Create work order
    const woRes = await request(app)
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        clientFacilityId: facilityId,
        leadTechnicianId: leadTechId,
        assignedTechnicianIds: [],
        title: 'Compressor Overhaul & Emergency Parts Test',
        description: 'Work order for emergency parts procurement and expense audit.',
        priority: 'CRITICAL_EMERGENCY',
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 14400000).toISOString(),
      });
    expect(woRes.status).toBe(201);
    workOrderId = woRes.body.workOrder.id;
  });

  describe('Expense Submission & Automated Threshold Auditing', () => {
    it('POST /api/expenses should forbid unassigned technicians', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${unassignedTechToken}`)
        .send({
          workOrderId,
          vendorName: 'Cooling World Refrigeration Ltd',
          receiptImageUrl: 'https://storage.whirldispatch.com/receipts/rec-01.jpg',
          receiptStoreLatitude: 6.9123,
          receiptStoreLongitude: 79.8645,
          items: [
            {
              partDescription: 'Copeland Contactor 40A',
              quantity: 1,
              unitPrice: 8500,
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('POST /api/expenses should record standard emergency parts purchase within threshold', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          vendorName: 'Cooling World Refrigeration Ltd',
          receiptNumber: 'REC-CW-2026-9081',
          currency: 'LKR',
          receiptImageUrl: 'https://storage.whirldispatch.com/receipts/rec-contactor-01.jpg',
          receiptStoreLatitude: 6.9123,
          receiptStoreLongitude: 79.8645,
          items: [
            {
              partDescription: 'Copeland Scroll Contactor 40A',
              quantity: 1,
              unitPrice: 8500,
            },
            {
              partDescription: 'Dual Run Capacitor 45+5 uF 440V',
              quantity: 2,
              unitPrice: 3200,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.claim).toBeDefined();
      expect(res.body.claim.totalAmount).toBe('14900.00');
      expect(res.body.claim.isThresholdExceeded).toBe(false);
      expect(res.body.claim.approvalStatus).toBe('PENDING_SUPERVISOR_APPROVAL');
      expect(res.body.items.length).toBe(2);
      standardClaimId = res.body.claim.id;
    });

    it('POST /api/expenses should flag purchases exceeding preset limit of 25,000 LKR', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          vendorName: 'Hayleys Industrial HVAC Supplies',
          receiptNumber: 'REC-HAY-7762',
          currency: 'LKR',
          receiptImageUrl: 'https://storage.whirldispatch.com/receipts/rec-actuator-02.jpg',
          receiptStoreLatitude: 6.9201,
          receiptStoreLongitude: 79.8612,
          items: [
            {
              partDescription: 'Danfoss Electronic Expansion Valve Actuator',
              quantity: 1,
              unitPrice: 38500,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.claim).toBeDefined();
      expect(res.body.claim.totalAmount).toBe('38500.00');
      expect(res.body.claim.isThresholdExceeded).toBe(true);
      expect(res.body.thresholdAlert).toBeDefined();
      expect(res.body.thresholdAlert.exceeded).toBe(true);
      highValueClaimId = res.body.claim.id;
    });
  });

  describe('Supervisor Optical Inspection & Expense Approval', () => {
    it('PATCH /api/expenses/:id/review should reject review attempts by technicians', async () => {
      const res = await request(app)
        .patch(`/api/expenses/${standardClaimId}/review`)
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          approvalStatus: 'APPROVED',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('PATCH /api/expenses/:id/review should require rejection reason when flagging or rejecting', async () => {
      const res = await request(app)
        .patch(`/api/expenses/${highValueClaimId}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          approvalStatus: 'FLAGGED_REJECTED',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
    });

    it('PATCH /api/expenses/:id/review should allow Supervisor to flag and reject claim with reason', async () => {
      const res = await request(app)
        .patch(`/api/expenses/${highValueClaimId}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          approvalStatus: 'FLAGGED_REJECTED',
          rejectionReason: 'Receipt image lacks clear vendor tax registration stamp and serial match.',
        });

      expect(res.status).toBe(200);
      expect(res.body.claim.approvalStatus).toBe('FLAGGED_REJECTED');
      expect(res.body.claim.rejectionReason).toContain('vendor tax registration stamp');
    });

    it('PATCH /api/expenses/:id/review should allow Supervisor to approve valid expense claim', async () => {
      const res = await request(app)
        .patch(`/api/expenses/${standardClaimId}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          approvalStatus: 'APPROVED',
        });

      expect(res.status).toBe(200);
      expect(res.body.claim.approvalStatus).toBe('APPROVED');
      expect(res.body.claim.reviewedBySupervisorId).toBeDefined();
      expect(res.body.claim.reviewedAt).not.toBeNull();
    });

    it('PATCH /api/expenses/:id/review should lock approved claims from further mutation', async () => {
      const res = await request(app)
        .patch(`/api/expenses/${standardClaimId}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          approvalStatus: 'FLAGGED_REJECTED',
          rejectionReason: 'Attempting to change approved claim',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ExpenseLocked');
    });
  });

  describe('Work Order Expense Ledger Retrieval', () => {
    it('GET /api/expenses/work-order/:id should return complete ledger and financial summary', async () => {
      const res = await request(app)
        .get(`/api/expenses/work-order/${workOrderId}`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.claimsCount).toBe(2);

      const summary = res.body.financialSummary;
      expect(summary.totalClaimedAmount).toBe(53400);
      expect(summary.totalApprovedAmount).toBe(14900);
      expect(summary.approvedClaimsCount).toBe(1);
      expect(summary.rejectedClaimsCount).toBe(1);
      expect(summary.pendingClaimsCount).toBe(0);
    });

    it('GET /api/expenses should return all company expense claims for supervisor review', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(res.body.expenses)).toBe(true);
      expect(Array.isArray(res.body.claims)).toBe(true);
    });
  });
});
