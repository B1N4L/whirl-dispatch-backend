import { Router } from 'express';
import {
  generateEstimate,
  previewEstimate,
  getInvoice,
  updateInvoiceStatus,
} from '../controllers/billing.controller';
import {
  getSwiftChartsAnalytics,
  getDashboardAnalytics,
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

export const billingRouter = Router();

billingRouter.use(authenticateToken);

billingRouter.get(
  '/dashboard-analytics',
  requireRole(['PAYMENT_CLERK', 'SUPERVISOR']),
  getDashboardAnalytics
);

billingRouter.get(
  '/estimate/:workOrderId',
  requireRole(['PAYMENT_CLERK', 'SUPERVISOR']),
  previewEstimate
);

billingRouter.post(
  '/estimate/:workOrderId',
  requireRole(['PAYMENT_CLERK', 'SUPERVISOR']),
  generateEstimate
);

billingRouter.get('/invoices/:id', getInvoice);

billingRouter.patch(
  '/invoices/:id/status',
  requireRole(['PAYMENT_CLERK', 'SUPERVISOR']),
  updateInvoiceStatus
);

billingRouter.get('/analytics/:workOrderId', getSwiftChartsAnalytics);
