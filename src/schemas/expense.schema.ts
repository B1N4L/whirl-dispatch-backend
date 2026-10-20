import { z } from 'zod';

export const expenseApprovalStatusEnum = z.enum([
  'PENDING_SUPERVISOR_APPROVAL',
  'APPROVED',
  'FLAGGED_REJECTED',
]);

export const expenseItemInputSchema = z.object({
  partDescription: z.string().min(1, 'Part description is required'),
  quantity: z.number().int().positive('Quantity must be at least 1').default(1),
  unitPrice: z.number().positive('Unit price must be positive'),
});

export const createExpenseClaimSchema = z.object({
  workOrderId: z.string().uuid('Valid work order UUID required'),
  vendorName: z.string().min(1, 'Vendor name is required'),
  receiptNumber: z.string().optional(),
  currency: z.string().default('LKR'),
  receiptImageUrl: z.string().min(1, 'Receipt image URL is required'),
  receiptStoreLatitude: z.number().min(-90).max(90, 'Valid latitude required'),
  receiptStoreLongitude: z.number().min(-180).max(180, 'Valid longitude required'),
  receiptCapturedAt: z.string().datetime().optional(),
  items: z.array(expenseItemInputSchema).min(1, 'At least one line item is required'),
});

export const reviewExpenseClaimSchema = z.object({
  approvalStatus: z.enum(['APPROVED', 'FLAGGED_REJECTED']),
  rejectionReason: z.string().optional(),
}).refine(
  (data) => {
    if (data.approvalStatus === 'FLAGGED_REJECTED' && (!data.rejectionReason || data.rejectionReason.trim().length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: 'Rejection reason is required when flagging or rejecting an expense claim.',
    path: ['rejectionReason'],
  }
);

export type ExpenseItemInput = z.infer<typeof expenseItemInputSchema>;
export type CreateExpenseClaimInput = z.infer<typeof createExpenseClaimSchema>;
export type ReviewExpenseClaimInput = z.infer<typeof reviewExpenseClaimSchema>;
