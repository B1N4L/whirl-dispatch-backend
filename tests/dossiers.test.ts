import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Diagnostic Inspection & Digital Proof-of-Work Dossier APIs', () => {
  let supervisorToken: string;
  let leadTechToken: string;
  let leadTechId: string;
  let unassignedTechToken: string;
  let facilityId: string;
  let facilityLat: number;
  let facilityLng: number;
  let workOrderId: string;
  let dossierId: string;

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
    facilityLat = facRes.body.facilities[0].latitude;
    facilityLng = facRes.body.facilities[0].longitude;

    // 5. Create work order
    const woRes = await request(app)
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        clientFacilityId: facilityId,
        leadTechnicianId: leadTechId,
        assignedTechnicianIds: [],
        title: 'Chiller Sensor Telemetry & Proof Dossier Test',
        description: 'Comprehensive diagnostic dossier logging with live photos and checklists.',
        priority: 'HIGH',
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 18000000).toISOString(),
      });
    expect(woRes.status).toBe(201);
    workOrderId = woRes.body.workOrder.id;
  });

  describe('Dossier Creation & RBAC Validation', () => {
    it('POST /api/dossiers should forbid unassigned technicians', async () => {
      const res = await request(app)
        .post('/api/dossiers')
        .set('Authorization', `Bearer ${unassignedTechToken}`)
        .send({
          workOrderId,
          equipmentModel: 'Daikin VRV IV-X System',
          equipmentSerialNumber: 'DKN-VRV-9874-2024',
          baselineSuctionPressurePsi: 58.20,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('POST /api/dossiers should allow Lead Technician to record baseline sensor telemetry', async () => {
      const res = await request(app)
        .post('/api/dossiers')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          equipmentModel: 'Daikin VRV IV-X System',
          equipmentSerialNumber: 'DKN-VRV-9874-2024',
          baselineSuctionPressurePsi: 58.20,
          baselineDischargePressurePsi: 260.50,
          baselineMotorRunningAmps: 18.40,
          baselineCoilTempDifferential: 8.50,
          diagnosticNotes: 'Low suction pressure detected and compressor running hot.',
          isCompleted: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.dossier).toBeDefined();
      expect(res.body.dossier.equipmentModel).toBe('Daikin VRV IV-X System');
      expect(res.body.dossier.isCompleted).toBe(false);
      dossierId = res.body.dossier.id;
    });
  });

  describe('Checklist Submission & Geotagged Proof Photos', () => {
    it('POST /api/dossiers/:id/checklist should record categorical inspection items', async () => {
      const res = await request(app)
        .post(`/api/dossiers/${dossierId}/checklist`)
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          items: [
            {
              category: 'COMPRESSOR_SYSTEM',
              itemLabel: 'Inspect oil level and acid test oil sample',
              isChecked: true,
              notes: 'Oil clear with minimal acid discoloration.',
            },
            {
              category: 'REFRIGERANT_CIRCUIT',
              itemLabel: 'Evacuate system and pressure test nitrogen at 450 PSI',
              isChecked: true,
              notes: 'Holding pressure verified with zero drop over 30 mins.',
            },
            {
              category: 'ELECTRICAL_CONTROLS',
              itemLabel: 'Calibrate thermostatic expansion valve sensors',
              isChecked: true,
              notes: 'Sensor delta recalibrated to factory spec.',
            },
            {
              category: 'CONDENSER_AIR_FLOW',
              itemLabel: 'Chemical wash on external condenser coil fins',
              isChecked: false,
              notes: 'Deferred to next preventive cycle.',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.checklistItems.length).toBe(4);
    });

    it('POST /api/dossiers/:id/photos should attach before-service proof photo with GPS stamp', async () => {
      const res = await request(app)
        .post(`/api/dossiers/${dossierId}/photos`)
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          photoType: 'BASELINE_BEFORE',
          photoUrl: 'https://storage.whirldispatch.com/proofs/wo-baseline-01.jpg',
          capturedLatitude: facilityLat,
          capturedLongitude: facilityLng,
          isLiveCameraCaptured: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.proofPhoto.photoType).toBe('BASELINE_BEFORE');
      expect(res.body.proofPhoto.isLiveCameraCaptured).toBe(true);
    });

    it('POST /api/dossiers/:id/photos should attach after-service proof photo with GPS stamp', async () => {
      const res = await request(app)
        .post(`/api/dossiers/${dossierId}/photos`)
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          photoType: 'POST_SERVICE_AFTER',
          photoUrl: 'https://storage.whirldispatch.com/proofs/wo-postservice-02.jpg',
          capturedLatitude: facilityLat,
          capturedLongitude: facilityLng,
          isLiveCameraCaptured: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.proofPhoto.photoType).toBe('POST_SERVICE_AFTER');
    });
  });

  describe('Post-Service Telemetry Update & Full Dossier Retrieval', () => {
    it('POST /api/dossiers should update post-service metrics and mark completed', async () => {
      const res = await request(app)
        .post('/api/dossiers')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          equipmentModel: 'Daikin VRV IV-X System',
          postServiceSuctionPressurePsi: 68.40,
          postServiceDischargePressurePsi: 225.10,
          postServiceMotorRunningAmps: 13.80,
          postServiceCoilTempDifferential: 14.20,
          diagnosticNotes: 'Refrigerant recharged, condenser coils rinsed. Unit operating within manufacturer nominal range.',
          isCompleted: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.dossier.isCompleted).toBe(true);
      expect(res.body.dossier.completedAt).not.toBeNull();
    });

    it('GET /api/dossiers/work-order/:id should return complete dossier with telemetry analysis', async () => {
      const res = await request(app)
        .get(`/api/dossiers/work-order/${workOrderId}`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.dossier).toBeDefined();
      expect(res.body.dossier.leadTechnician).toBeDefined();
      expect(res.body.dossier.checklistItems.length).toBe(4);
      expect(res.body.dossier.proofPhotos.length).toBe(2);

      // Verify computed analytics
      const analysis = res.body.telemetryAnalysis;
      expect(analysis.suctionPressureDeltaPsi).toBe(10.2);
      expect(analysis.dischargePressureDeltaPsi).toBe(-35.4);
      expect(analysis.motorRunningAmpsReduction).toBe(4.6);
      expect(analysis.coilTempDifferentialGain).toBe(5.7);
      expect(analysis.checklistCompletionRatePercent).toBe(75);
      expect(analysis.totalPhotosAttached).toBe(2);
    });
  });
});
