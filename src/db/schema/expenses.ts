import { pgTable, uuid, varchar, text, numeric, boolean, timestamp, doublePrecision, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workOrders } from './workOrders.js';
import { users } from './users.js';

export const expenseApprovalStatusEnum = pgEnum('expense_approval_status', [
  'PENDING_SUPERVISOR_APPROVAL',
  'APPROVED',
  'FLAGGED_REJECTED',
]);

export const expenseClaims = pgTable('expense_claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  workOrderId: uuid('work_order_id')
    .references(() => workOrders.id, { onDelete: 'cascade' })
    .notNull(),
  leadTechnicianId: uuid('lead_technician_id')
    .references(() => users.id)
    .notNull(),
  vendorName: varchar('vendor_name', { length: 255 }).notNull(),
  receiptNumber: varchar('receipt_number', { length: 100 }),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('LKR').notNull(),
  receiptImageUrl: text('receipt_image_url').notNull(),
  receiptStoreLatitude: doublePrecision('receipt_store_latitude').notNull(),
  receiptStoreLongitude: doublePrecision('receipt_store_longitude').notNull(),
  receiptCapturedAt: timestamp('receipt_captured_at', { withTimezone: true }).defaultNow().notNull(),
  isThresholdExceeded: boolean('is_threshold_exceeded').default(false).notNull(),
  approvalStatus: expenseApprovalStatusEnum('approval_status')
    .default('PENDING_SUPERVISOR_APPROVAL')
    .notNull(),
  reviewedBySupervisorId: uuid('reviewed_by_supervisor_id').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const expenseItems = pgTable('expense_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  expenseClaimId: uuid('expense_claim_id')
    .references(() => expenseClaims.id, { onDelete: 'cascade' })
    .notNull(),
  partDescription: varchar('part_description', { length: 255 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
});

export const expenseClaimsRelations = relations(expenseClaims, ({ one, many }) => ({
  workOrder: one(workOrders, {
    fields: [expenseClaims.workOrderId],
    references: [workOrders.id],
  }),
  leadTechnician: one(users, {
    fields: [expenseClaims.leadTechnicianId],
    references: [users.id],
    relationName: 'leadTechnicianExpenses',
  }),
  reviewedBySupervisor: one(users, {
    fields: [expenseClaims.reviewedBySupervisorId],
    references: [users.id],
    relationName: 'supervisorExpenseReviews',
  }),
  items: many(expenseItems),
}));

export const expenseItemsRelations = relations(expenseItems, ({ one }) => ({
  claim: one(expenseClaims, {
    fields: [expenseItems.expenseClaimId],
    references: [expenseClaims.id],
  }),
}));
