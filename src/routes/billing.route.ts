import { Router } from 'express';
import {
  generateEstimate,
  getInvoice,
  updateInvoiceStatus,
} from '../controllers/billing.controller';
import { getSwiftChartsAnalytics } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

export const billingRouter = Router();

billingRouter.use(authenticateToken);

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
