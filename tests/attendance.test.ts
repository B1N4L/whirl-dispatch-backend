import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Anti-Ghost Clocking & Geofence Site Attendance Telemetry APIs', () => {
  let supervisorToken: string;
  let leadTechToken: string;
  let leadTechId: string;
  let unassignedTechToken: string;
  let facilityId: string;
  let facilityLat: number;
  let facilityLng: number;
  let workOrderId: string;
  let attendanceSessionId: string;

  it('Setup: Authenticate users, get facility coordinates, and create work order', async () => {
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

    // 4. Fetch facility and its coordinates
    const facRes = await request(app)
      .get('/api/facilities')
      .set('Authorization', `Bearer ${supervisorToken}`);
    expect(facRes.body.facilities.length).toBeGreaterThan(0);
    const facility = facRes.body.facilities[0];
    facilityId = facility.id;
    facilityLat = facility.latitude;
    facilityLng = facility.longitude;

    // 5. Create a work order for attendance testing
    const woRes = await request(app)
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        clientFacilityId: facilityId,
        leadTechnicianId: leadTechId,
        assignedTechnicianIds: [],
        title: 'Chiller Geofence Attendance Integration Test',
        description: 'Testing tamper-resistant anti-ghost clocking and boundary breach logging.',
        priority: 'MEDIUM',
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 14400000).toISOString(),
      });
    expect(woRes.status).toBe(201);
    workOrderId = woRes.body.workOrder.id;
  });

  describe('Anti-Ghost Clocking Geofence Verification', () => {
    it('POST /api/attendance/clock-in should reject unassigned technicians', async () => {
      const res = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', `Bearer ${unassignedTechToken}`)
        .send({
          workOrderId,
          latitude: facilityLat,
          longitude: facilityLng,
          accuracyMeters: 5.0,
          biometricVerified: true,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('POST /api/attendance/clock-in should reject clock-in outside client site geofence', async () => {
      // 5km away from facility
      const outsideLat = facilityLat + 0.05;
      const outsideLng = facilityLng + 0.05;

      const res = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          latitude: outsideLat,
          longitude: outsideLng,
          accuracyMeters: 5.0,
          biometricVerified: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('OutOfGeofence');
      expect(res.body.currentDistanceMeters).toBeGreaterThan(100);
    });

    it('POST /api/attendance/clock-in should succeed within geofence perimeter and log tamper audit', async () => {
      // Within ~10 meters of facility
      const res = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          latitude: facilityLat + 0.00005,
          longitude: facilityLng + 0.00005,
          accuracyMeters: 4.5,
          biometricVerified: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.session).toBeDefined();
      expect(res.body.session.sessionStatus).toBe('ACTIVE_ON_SITE');
      expect(res.body.geofenceVerification.perimeterVerified).toBe(true);
      attendanceSessionId = res.body.session.id;
    });

    it('POST /api/attendance/clock-in should reject duplicate clock-in if already active', async () => {
      const res = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          latitude: facilityLat,
          longitude: facilityLng,
          accuracyMeters: 5.0,
          biometricVerified: true,
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('SessionActive');
    });
  });

  describe('Boundary Breach Detection & Shift Timer Pause', () => {
    it('POST /api/attendance/boundary-event should pause shift timer upon perimeter exit breach', async () => {
      const outsideLat = facilityLat + 0.02;
      const outsideLng = facilityLng + 0.02;

      const res = await request(app)
        .post('/api/attendance/boundary-event')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          eventType: 'GEOFENCE_EXIT_BREACH',
          latitude: outsideLat,
          longitude: outsideLng,
          accuracyMeters: 8.0,
          notes: 'Technician exited 100m client perimeter during maintenance shift.',
        });

      expect(res.status).toBe(200);
      expect(res.body.sessionStatus).toBe('ON_BREAK_VIOLATION');
      expect(res.body.event.eventType).toBe('GEOFENCE_EXIT_BREACH');
    });

    it('POST /api/attendance/resume-shift should reject resumption while device remains outside geofence', async () => {
      const outsideLat = facilityLat + 0.02;
      const outsideLng = facilityLng + 0.02;

      const res = await request(app)
        .post('/api/attendance/resume-shift')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          latitude: outsideLat,
          longitude: outsideLng,
          accuracyMeters: 5.0,
          biometricVerified: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('OutOfGeofence');
    });

    it('POST /api/attendance/resume-shift should reject resumption without Face ID/biometric verification', async () => {
      const res = await request(app)
        .post('/api/attendance/resume-shift')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          latitude: facilityLat,
          longitude: facilityLng,
          accuracyMeters: 5.0,
          biometricVerified: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
    });

    it('POST /api/attendance/resume-shift should resume shift inside geofence with biometric verification', async () => {
      const res = await request(app)
        .post('/api/attendance/resume-shift')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          latitude: facilityLat,
          longitude: facilityLng,
          accuracyMeters: 5.0,
          biometricVerified: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.session.sessionStatus).toBe('ACTIVE_ON_SITE');
      expect(res.body.biometricVerified).toBe(true);
    });
  });

  describe('Clock-out & Full Attendance Timeline', () => {
    it('POST /api/attendance/clock-out should complete shift and calculate billable seconds', async () => {
      const res = await request(app)
        .post('/api/attendance/clock-out')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          latitude: facilityLat,
          longitude: facilityLng,
          accuracyMeters: 5.0,
        });

      expect(res.status).toBe(200);
      expect(res.body.session.sessionStatus).toBe('CLOCKED_OUT');
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.totalBillableSeconds).toBeGreaterThanOrEqual(0);
    });

    it('GET /api/attendance/work-order/:id should return complete attendance timeline and audit logs', async () => {
      const res = await request(app)
        .get(`/api/attendance/work-order/${workOrderId}`)
        .set('Authorization', `Bearer ${leadTechToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.sessions[0].auditLogs.length).toBeGreaterThanOrEqual(3);

      const eventTypes = res.body.sessions[0].auditLogs.map((l: any) => l.eventType);
      expect(eventTypes).toContain('GEOFENCE_ENTER');
      expect(eventTypes).toContain('GEOFENCE_EXIT_BREACH');
      expect(eventTypes).toContain('BIOMETRIC_REAUTH_RESUME');
      expect(eventTypes).toContain('BREAK_PAUSED');
    });

    it('POST /api/attendance/clock-in should allow second clock-in on same day after clocking out', async () => {
      // 1. Clock in a second time
      const clockInRes = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          latitude: facilityLat,
          longitude: facilityLng,
          accuracyMeters: 5.0,
          biometricVerified: true,
        });

      expect(clockInRes.status).toBe(201);
      expect(clockInRes.body.session.sessionStatus).toBe('ACTIVE_ON_SITE');

      // 2. Query GET /api/attendance/current
      const currentRes = await request(app)
        .get('/api/attendance/current')
        .set('Authorization', `Bearer ${leadTechToken}`);

      expect(currentRes.status).toBe(200);
      expect(currentRes.body.active).toBe(true);
      expect(currentRes.body.session.id).toBe(clockInRes.body.session.id);

      // 3. Clock out second session
      const clockOutRes = await request(app)
        .post('/api/attendance/clock-out')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          workOrderId,
          latitude: facilityLat,
          longitude: facilityLng,
          accuracyMeters: 5.0,
        });

      expect(clockOutRes.status).toBe(200);
      expect(clockOutRes.body.session.sessionStatus).toBe('CLOCKED_OUT');
    });
  });
});
