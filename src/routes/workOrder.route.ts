import { Router } from 'express';
import {
  createWorkOrder,
  getWorkOrders,
  getWorkOrderDetail,
} from '../controllers/workOrder.controller';
import { updateWorkOrderStatus } from '../controllers/workOrderStatus.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

export const workOrdersRouter = Router();

workOrdersRouter.use(authenticateToken);

workOrdersRouter.get('/', getWorkOrders);
workOrdersRouter.get('/:id', getWorkOrderDetail);
workOrdersRouter.post('/', requireRole(['SUPERVISOR']), createWorkOrder);
workOrdersRouter.patch('/:id/status', updateWorkOrderStatus);
