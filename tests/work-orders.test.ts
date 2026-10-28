import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Work Order Dispatch & EventKit Scheduling APIs', () => {
  let supervisorToken: string;
  let leadTechToken: string;
  let leadTechId: string;
  let unassignedTechToken: string;
  let unassignedTechId: string;
  let facilityId: string;
  let fleetAssetId: string;
  let createdWorkOrderId: string;

  it('Setup: Authenticate users and fetch seeded entities', async () => {
    // 1. Supervisor login
    const supLogin = await request(app).post('/api/auth/login').send({
      email: 'sarath.supervisor@whirldispatch.com',
      password: 'password123',
    });
    supervisorToken = supLogin.body.token;

    // 2. Lead Tech login
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
    unassignedTechId = unassignedLogin.body.user.id;

    // 4. Fetch a seeded facility (Hemas HQ)
    const facRes = await request(app)
      .get('/api/facilities')
      .set('Authorization', `Bearer ${supervisorToken}`);
    expect(facRes.body.facilities.length).toBeGreaterThan(0);
    facilityId = facRes.body.facilities[0].id;

    // 5. Fetch available fleet asset (Toyota HiAce Van #04)
    const fleetRes = await request(app)
      .get('/api/fleet')
      .set('Authorization', `Bearer ${supervisorToken}`);
    expect(fleetRes.body.fleet.length).toBeGreaterThan(0);
    const availableVan = fleetRes.body.fleet.find((f: any) => f.status === 'AVAILABLE') || fleetRes.body.fleet[0];
    fleetAssetId = availableVan.id;
  });

  describe('Work Order Dispatch Lifecycle', () => {
    it('POST /api/work-orders should reject non-supervisor users', async () => {
      const res = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          clientFacilityId: facilityId,
          leadTechnicianId: leadTechId,
          title: 'Unauthorized dispatch attempt',
          description: 'This should fail with 403',
          scheduledStartTime: new Date().toISOString(),
          scheduledEndTime: new Date(Date.now() + 3600000).toISOString(),
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/work-orders should allow SUPERVISOR to create and dispatch a work order', async () => {
      const scheduledStart = new Date(Date.now() + 1800000).toISOString();
      const scheduledEnd = new Date(Date.now() + 14400000).toISOString();

      const res = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          clientFacilityId: facilityId,
          leadTechnicianId: leadTechId,
          assignedFleetAssetId: fleetAssetId,
          assignedTechnicianIds: [],
          title: 'Emergency Ventilation Fan V-Belt Snapped',
          description: 'Mechanical plant room exhaust fan motor spinning free. Belt severed.',
          priority: 'CRITICAL_EMERGENCY',
          scheduledStartTime: scheduledStart,
          scheduledEndTime: scheduledEnd,
        });

      expect(res.status).toBe(201);
      expect(res.body.workOrder).toHaveProperty('id');
      expect(res.body.workOrder.workOrderNumber).toMatch(/^WO-2026-\d{4}$/);
      expect(res.body.workOrder.status).toBe('DISPATCHED');
      createdWorkOrderId = res.body.workOrder.id;

      // Verify that the fleet asset status transitioned to DEPLOYED
      const assetRes = await request(app)
        .get(`/api/fleet/${fleetAssetId}`)
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(assetRes.body.asset.status).toBe('DEPLOYED');
    });

    it('POST /api/work-orders should reject assigning a technician who is already on an active dispatch', async () => {
      const res = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          clientFacilityId: facilityId,
          leadTechnicianId: leadTechId,
          assignedTechnicianIds: [],
          title: 'Concurrent Dispatch Conflict Test',
          description: 'This attempt must fail because the lead technician is already dispatched.',
          priority: 'HIGH',
          scheduledStartTime: new Date().toISOString(),
          scheduledEndTime: new Date(Date.now() + 7200000).toISOString(),
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('TechnicianUnavailable');
      expect(res.body.message).toContain('already assigned to active dispatch');
    });

    it('POST /api/work-orders should reject deploying a fleet asset that is already deployed', async () => {
      const res = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          clientFacilityId: facilityId,
          leadTechnicianId: unassignedTechId,
          assignedFleetAssetId: fleetAssetId,
          assignedTechnicianIds: [],
          title: 'Concurrent Fleet Deployment Conflict Test',
          description: 'This attempt must fail because the fleet vehicle is already deployed.',
          priority: 'MEDIUM',
          scheduledStartTime: new Date().toISOString(),
          scheduledEndTime: new Date(Date.now() + 7200000).toISOString(),
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('AssetUnavailable');
      expect(res.body.message).toContain('currently deployed');
    });

    it('GET /api/work-orders should return dispatches and filter appropriately', async () => {
      const supRes = await request(app)
        .get('/api/work-orders')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(supRes.status).toBe(200);
      expect(supRes.body.count).toBeGreaterThan(0);

      const leadRes = await request(app)
        .get('/api/work-orders')
        .set('Authorization', `Bearer ${leadTechToken}`);
      expect(leadRes.status).toBe(200);
      const containsAssigned = leadRes.body.workOrders.some((wo: any) => wo.id === createdWorkOrderId);
      expect(containsAssigned).toBe(true);
    });

    it('GET /api/work-orders/:id should include structured EventKit calendar payload', async () => {
      const res = await request(app)
        .get(`/api/work-orders/${createdWorkOrderId}`)
        .set('Authorization', `Bearer ${leadTechToken}`);

      expect(res.status).toBe(200);
      expect(res.body.workOrder.id).toBe(createdWorkOrderId);

      // Verify EventKit payload formatting for native iOS Calendar
      const eventKit = res.body.eventKitPayload;
      expect(eventKit).toBeDefined();
      expect(eventKit.calendarIdentifier).toMatch(/^WHIRL-DISPATCH-WO-2026-\d{4}$/);
      expect(eventKit.structuredLocation).toHaveProperty('latitude');
      expect(eventKit.structuredLocation).toHaveProperty('longitude');
      expect(eventKit.structuredLocation).toHaveProperty('radiusMeters');
      expect(Array.isArray(eventKit.alarms)).toBe(true);
      expect(eventKit.alarms.length).toBe(2);
      expect(eventKit.alarms[0].relativeOffsetSeconds).toBe(-3600); // 1-hour transit alarm
    });

    it('PATCH /api/work-orders/:id/status should forbid unassigned technicians', async () => {
      const res = await request(app)
        .patch(`/api/work-orders/${createdWorkOrderId}/status`)
        .set('Authorization', `Bearer ${unassignedTechToken}`)
        .send({ status: 'EN_ROUTE' });

      expect(res.status).toBe(403);
    });

    it('PATCH /api/work-orders/:id/status should transition lifecycle to COMPLETED and release fleet vehicle', async () => {
      // 1. Transition to EN_ROUTE
      const enRouteRes = await request(app)
        .patch(`/api/work-orders/${createdWorkOrderId}/status`)
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({ status: 'EN_ROUTE' });
      expect(enRouteRes.status).toBe(200);
      expect(enRouteRes.body.workOrder.status).toBe('EN_ROUTE');

      // 2. Transition to ON_SITE_ACTIVE
      const onSiteRes = await request(app)
        .patch(`/api/work-orders/${createdWorkOrderId}/status`)
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({ status: 'ON_SITE_ACTIVE' });
      expect(onSiteRes.status).toBe(200);
      expect(onSiteRes.body.workOrder.status).toBe('ON_SITE_ACTIVE');

      // 3. Transition to COMPLETED
      const completedRes = await request(app)
        .patch(`/api/work-orders/${createdWorkOrderId}/status`)
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({ status: 'COMPLETED' });
      expect(completedRes.status).toBe(200);
      expect(completedRes.body.workOrder.status).toBe('COMPLETED');
      expect(completedRes.body.workOrder.actualEndTime).toBeDefined();

      // Verify that the fleet asset status reverted to AVAILABLE
      const assetRes = await request(app)
        .get(`/api/fleet/${fleetAssetId}`)
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(assetRes.body.asset.status).toBe('AVAILABLE');
    });

    it('GET /api/work-orders/:id/team-telemetry should return team coordinates and geofence metrics for Lead Tech', async () => {
      const res = await request(app)
        .get(`/api/work-orders/${createdWorkOrderId}/team-telemetry`)
        .set('Authorization', `Bearer ${leadTechToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('workOrderId', createdWorkOrderId);
      expect(res.body.facility).toHaveProperty('geofenceRadius');
      expect(Array.isArray(res.body.team)).toBe(true);
      expect(res.body.team.length).toBeGreaterThan(0);
      expect(res.body.team[0]).toHaveProperty('isInsideGeofence');
      expect(res.body.team[0]).toHaveProperty('distanceToFacilityMeters');
      expect(res.body.team[0]).toHaveProperty('formattedDistance');
    });

    it('GET /api/work-orders/:id/team-telemetry should reject unauthorized technicians without lead/supervisor role', async () => {
      const res = await request(app)
        .get(`/api/work-orders/${createdWorkOrderId}/team-telemetry`)
        .set('Authorization', `Bearer ${unassignedTechToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Forbidden');
    });

    it('POST /api/work-orders/:id/telemetry should reject unauthorized technicians not assigned to job', async () => {
      const res = await request(app)
        .post(`/api/work-orders/${createdWorkOrderId}/telemetry`)
        .set('Authorization', `Bearer ${unassignedTechToken}`)
        .send({
          latitude: 6.9271,
          longitude: 79.8612,
          accuracyMeters: 4.5,
          batteryLevel: 92,
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Forbidden');
    });

    it('POST /api/work-orders/:id/telemetry should allow assigned Lead Tech to log periodic GPS ping', async () => {
      const res = await request(app)
        .post(`/api/work-orders/${createdWorkOrderId}/telemetry`)
        .set('Authorization', `Bearer ${leadTechToken}`)
        .send({
          latitude: 6.9344,
          longitude: 79.8428,
          accuracyMeters: 3.2,
          batteryLevel: 87,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.telemetry.latitude).toBe(6.9344);
      expect(res.body.telemetry.longitude).toBe(79.8428);
      expect(res.body.telemetry.batteryLevel).toBe(87);
      expect(res.body.telemetry).toHaveProperty('distanceMeters');
      expect(res.body.telemetry).toHaveProperty('isInsideGeofence');
    });

    it('GET /api/work-orders/:id/team-telemetry should return updated live position and battery level', async () => {
      const res = await request(app)
        .get(`/api/work-orders/${createdWorkOrderId}/team-telemetry`)
        .set('Authorization', `Bearer ${leadTechToken}`);

      expect(res.status).toBe(200);
      const leadMember = res.body.team.find((m: any) => m.isLead);
      expect(leadMember).toBeDefined();
      expect(leadMember.latitude).toBe(6.9344);
      expect(leadMember.longitude).toBe(79.8428);
      expect(leadMember.batteryLevel).toBe(87);
    });
  });
});
