import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { expenseClaims } from '../db/schema/index';
import { eq } from 'drizzle-orm';

export async function verifyExpenseNotLocked(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;

    const claim = await db.query.expenseClaims.findFirst({
      where: eq(expenseClaims.id, id),
    });

    if (!claim) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Expense claim not found.',
      });
      return;
    }

    if (claim.approvalStatus === 'APPROVED') {
      res.status(409).json({
        error: 'ExpenseLocked',
        message: 'Approved expense claim is permanently locked from modifications or status mutations.',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('[EXPENSE LOCK ERROR]', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to verify expense lock state.',
    });
  }
}
