import { Router } from 'express';
import {
  createExpenseClaim,
  getAllExpenses,
  getExpensesByWorkOrder,
} from '../controllers/expense.controller';
import { reviewExpenseClaim } from '../controllers/expenseApproval.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

export const expenseRouter = Router();

expenseRouter.use(authenticateToken);

expenseRouter.post('/', createExpenseClaim);
expenseRouter.get('/', getAllExpenses);
expenseRouter.get('/work-order/:id', getExpensesByWorkOrder);
expenseRouter.patch(
  '/:id/review',
  requireRole(['SUPERVISOR']),
  reviewExpenseClaim
);
