import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Health Check API Smoke Test', () => {
  it('GET /api/health should return 200 with service status telemetry', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('service', 'WhirlDispatch Backend API');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptimeSeconds');
  });

  it('GET /api/unknown-endpoint should return 404 NotFound', async () => {
    const response = await request(app).get('/api/unknown-endpoint');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'NotFound');
    expect(response.body).toHaveProperty(
      'message',
      'The requested endpoint does not exist on WhirlDispatch API server.'
    );
  });
});
