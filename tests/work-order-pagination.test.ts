import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Work Order Pagination and Filter Counts API', () => {
  let supervisorToken: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'sarath.supervisor@whirldispatch.com',
        password: 'password123',
      });
    expect(loginRes.status).toBe(200);
    supervisorToken = loginRes.body.token;
  });

  it('GET /api/work-orders should return envelope with countsByFilter and totalCount', async () => {
    const res = await request(app)
      .get('/api/work-orders')
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('totalCount');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('countsByFilter');
    expect(res.body.countsByFilter).toHaveProperty('all');
    expect(res.body.countsByFilter).toHaveProperty('emergency');
    expect(res.body.countsByFilter).toHaveProperty('active');
    expect(res.body.countsByFilter).toHaveProperty('completed');
    expect(typeof res.body.countsByFilter.all).toBe('number');
    expect(Array.isArray(res.body.workOrders)).toBe(true);
  });

  it('GET /api/work-orders?limit=2&page=1 should paginate dispatches correctly', async () => {
    const res = await request(app)
      .get('/api/work-orders?limit=2&page=1')
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeLessThanOrEqual(2);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
    expect(res.body.workOrders.length).toBeLessThanOrEqual(2);
  });
});
