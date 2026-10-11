import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Authentication & JWT API Tests', () => {
  it('POST /api/auth/login should authenticate seeded user and return JWT', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'sarath.supervisor@whirldispatch.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'sarath.supervisor@whirldispatch.com');
    expect(res.body.user).toHaveProperty('role', 'SUPERVISOR');
  });

  it('POST /api/auth/login should reject invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'sarath.supervisor@whirldispatch.com',
      password: 'wrong_password',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'AuthenticationFailed');
  });

  it('GET /api/auth/me should return authenticated user profile with valid Bearer token', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'kasun.lead@whirldispatch.com',
      password: 'password123',
    });
    const token = loginRes.body.token;

    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.user).toHaveProperty('email', 'kasun.lead@whirldispatch.com');
    expect(profileRes.body.user).toHaveProperty('role', 'LEAD_TECHNICIAN');
  });

  it('GET /api/auth/me should return 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('RBAC Middleware & Biometric Verification Tests', () => {
  it('RBAC should allow SUPERVISOR and forbid TECHNICIAN on supervisor route', async () => {
    // 1. Login as Supervisor
    const supLogin = await request(app).post('/api/auth/login').send({
      email: 'sarath.supervisor@whirldispatch.com',
      password: 'password123',
    });
    const supToken = supLogin.body.token;

    // 2. Login as Technician
    const techLogin = await request(app).post('/api/auth/login').send({
      email: 'nuwan.tech@whirldispatch.com',
      password: 'password123',
    });
    const techToken = techLogin.body.token;

    // Supervisor access should be allowed (200)
    const supRes = await request(app)
      .get('/api/auth/supervisor-check')
      .set('Authorization', `Bearer ${supToken}`);
    expect(supRes.status).toBe(200);
    expect(supRes.body.authorized).toBe(true);

    // Technician access should be forbidden (403)
    const techRes = await request(app)
      .get('/api/auth/supervisor-check')
      .set('Authorization', `Bearer ${techToken}`);
    expect(techRes.status).toBe(403);
    expect(techRes.body).toHaveProperty('error', 'Forbidden');
  });

  it('POST /api/auth/biometric-verify should validate biometric session token', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'kasun.lead@whirldispatch.com',
      password: 'password123',
    });
    const token = loginRes.body.token;

    const bioRes = await request(app)
      .post('/api/auth/biometric-verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: 'IPHONE-15-PRO-FIELD',
        biometricType: 'FACE_ID',
      });

    expect(bioRes.status).toBe(200);
    expect(bioRes.body.verified).toBe(true);
    expect(bioRes.body.biometricType).toBe('FACE_ID');
    expect(bioRes.body.role).toBe('LEAD_TECHNICIAN');
    expect(bioRes.body).toHaveProperty('verifiedAt');
  });
});
