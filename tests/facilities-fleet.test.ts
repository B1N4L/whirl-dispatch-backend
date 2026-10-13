import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Facilities & Fleet Management APIs', () => {
  let supervisorToken: string;
  let technicianToken: string;
  let createdFacilityId: string;
  let createdAssetId: string;

  it('Setup: Authenticate users for test suite', async () => {
    // 1. Supervisor login
    const supLogin = await request(app).post('/api/auth/login').send({
      email: 'sarath.supervisor@whirldispatch.com',
      password: 'password123',
    });
    expect(supLogin.status).toBe(200);
    supervisorToken = supLogin.body.token;

    // 2. Technician login
    const techLogin = await request(app).post('/api/auth/login').send({
      email: 'nuwan.tech@whirldispatch.com',
      password: 'password123',
    });
    expect(techLogin.status).toBe(200);
    technicianToken = techLogin.body.token;
  });

  describe('Client Facilities Endpoints', () => {
    it('GET /api/facilities should return list of seeded facilities', async () => {
      const res = await request(app)
        .get('/api/facilities')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.facilities)).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.facilities[0]).toHaveProperty('geofenceRadius');
      expect(res.body.facilities[0]).toHaveProperty('latitude');
      expect(res.body.facilities[0]).toHaveProperty('longitude');
    });

    it('POST /api/facilities should reject non-supervisor users', async () => {
      const res = await request(app)
        .post('/api/facilities')
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({
          companyName: 'Unauthorized Corp',
          facilityName: 'Unauthorized Facility',
          address: 'Colombo',
          latitude: 6.9,
          longitude: 79.8,
          contactPersonName: 'John',
          contactPhone: '123456',
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/facilities should allow SUPERVISOR to register a new commercial site', async () => {
      const res = await request(app)
        .post('/api/facilities')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          companyName: 'Dialog Axiata PLC',
          facilityName: 'Dialog Headquarters Data Center AHU',
          address: '475 Union Place, Colombo 02',
          latitude: 6.918,
          longitude: 79.862,
          geofenceRadius: 100.0,
          contactPersonName: 'Sunil Perera',
          contactPhone: '+94 11 710 0100',
          contactEmail: 'sunil.p@dialog.lk',
          slaResponseHours: 2,
          contractHourlyRate: '95.00',
          partsMarkupPercent: '18.00',
        });

      expect(res.status).toBe(201);
      expect(res.body.facility).toHaveProperty('id');
      expect(res.body.facility.facilityName).toBe('Dialog Headquarters Data Center AHU');
      createdFacilityId = res.body.facility.id;
    });

    it('GET /api/facilities/:id should return single facility details', async () => {
      const res = await request(app)
        .get(`/api/facilities/${createdFacilityId}`)
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.facility.id).toBe(createdFacilityId);
      expect(res.body.facility.companyName).toBe('Dialog Axiata PLC');
    });
  });

  describe('Fleet Asset Management Endpoints', () => {
    it('GET /api/fleet should return list of seeded fleet assets', async () => {
      const res = await request(app)
        .get('/api/fleet')
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.fleet)).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.fleet[0]).toHaveProperty('assetCode');
      expect(res.body.fleet[0]).toHaveProperty('licensePlate');
      expect(res.body.fleet[0]).toHaveProperty('status');
    });

    it('POST /api/fleet should allow SUPERVISOR to add a fleet vehicle', async () => {
      const uniqueCode = `VAN-${Date.now().toString().slice(-4)}`;
      const res = await request(app)
        .post('/api/fleet')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          assetCode: uniqueCode,
          name: 'Isuzu Elf Heavy Maintenance Truck #09',
          assetType: 'SERVICE_TRUCK',
          licensePlate: 'WP-LB-5599',
          status: 'AVAILABLE',
        });

      expect(res.status).toBe(201);
      expect(res.body.asset.assetCode).toBe(uniqueCode);
      createdAssetId = res.body.asset.id;
    });

    it('PATCH /api/fleet/:id/status should update vehicle status', async () => {
      const res = await request(app)
        .patch(`/api/fleet/${createdAssetId}/status`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          status: 'DEPLOYED',
        });

      expect(res.status).toBe(200);
      expect(res.body.asset.status).toBe('DEPLOYED');
    });
  });
});
