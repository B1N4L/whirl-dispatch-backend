import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('OpenAPI 3.0 Swagger & Push Notifications Queue APIs', () => {
  let supervisorToken: string;
  let leadTechToken: string;
  let leadTechId: string;
  let notificationId: string;

  it('Setup: Authenticate users for notification verification', async () => {
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
  });

  describe('OpenAPI 3.0 Swagger Documentation', () => {
    it('GET /api/docs/json should return valid OpenAPI 3.0 specification document', async () => {
      const res = await request(app).get('/api/docs/json');

      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.info.title).toContain('WhirlDispatch HVAC Field Operations API');
      expect(res.body.paths).toBeDefined();
      expect(res.body.paths['/health']).toBeDefined();
      expect(res.body.paths['/auth/login']).toBeDefined();
      expect(res.body.paths['/work-orders']).toBeDefined();
      expect(res.body.paths['/attendance/clock-in']).toBeDefined();
      expect(res.body.paths['/billing/estimate/{workOrderId}']).toBeDefined();
    });

    it('GET /api/docs/ should serve interactive Swagger HTML UI', async () => {
      const res = await request(app).get('/api/docs/');

      // swagger-ui-express returns HTML or redirect
      expect([200, 301, 302]).toContain(res.status);
    });
  });

  describe('System Notification Queue', () => {
    it('GET /api/notifications should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('GET /api/notifications should return notification feed and unread count', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.recipientUserId).toBeDefined();
      expect(res.body.unreadCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(res.body.notifications)).toBe(true);

      if (res.body.notifications.length > 0) {
        notificationId = res.body.notifications[0].id;
      }
    });

    it('PATCH /api/notifications/:id/read should mark notification as read', async () => {
      if (!notificationId) {
        // If no notifications exist for supervisor yet, test skips gracefully
        return;
      }

      const res = await request(app)
        .patch(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notification.isRead).toBe(true);
    });
  });

  describe('iOS WidgetKit Lock Screen & Home Screen Shift Telemetry Feed', () => {
    it('GET /api/telemetry/widget/:technicianId should return structured widget display metadata', async () => {
      const res = await request(app).get(`/api/telemetry/widget/${leadTechId}`);

      expect(res.status).toBe(200);
      expect(res.body.technicianId).toBe(leadTechId);
      expect(res.body.technicianName).toBe('Kasun Perera');
      expect(typeof res.body.hasActiveShift).toBe('boolean');
      expect(res.body.shiftStatus).toBeDefined();

      const widget = res.body.widgetDisplay;
      expect(widget).toBeDefined();
      expect(widget.headline).toBeDefined();
      expect(widget.subline).toBeDefined();
      expect(widget.statusColorHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(widget.batteryFriendlyRefreshIntervalSeconds).toBeGreaterThan(0);
    });
  });
});
