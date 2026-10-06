import { pgTable, uuid, varchar, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workOrders } from './workOrders.js';
import { clientFacilities } from './facilities.js';
import { users } from './users.js';

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'DRAFT_ESTIMATE',
  'APPROVED_BY_SUPERVISOR',
  'ISSUED_TO_CLIENT',
  'PAID',
]);

export const billingInvoices = pgTable('billing_invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  workOrderId: uuid('work_order_id')
    .references(() => workOrders.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  clientFacilityId: uuid('client_facility_id')
    .references(() => clientFacilities.id)
    .notNull(),
  clerkId: uuid('clerk_id')
    .references(() => users.id)
    .notNull(),
  totalBillableLaborHours: numeric('total_billable_labor_hours', { precision: 8, scale: 2 }).notNull(),
  hourlyLaborRateApplied: numeric('hourly_labor_rate_applied', { precision: 10, scale: 2 }).notNull(),
  subtotalLabor: numeric('subtotal_labor', { precision: 12, scale: 2 }).notNull(),
  subtotalApprovedParts: numeric('subtotal_approved_parts', { precision: 12, scale: 2 }).default('0.00').notNull(),
  partsMarkupPercentApplied: numeric('parts_markup_percent_applied', { precision: 5, scale: 2 }).default('0.00').notNull(),
  subtotalPartsWithMarkup: numeric('subtotal_parts_with_markup', { precision: 12, scale: 2 }).default('0.00').notNull(),
  fleetEquipmentFee: numeric('fleet_equipment_fee', { precision: 10, scale: 2 }).default('0.00').notNull(),
  taxPercent: numeric('tax_percent', { precision: 5, scale: 2 }).default('8.00').notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull(),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').default('DRAFT_ESTIMATE').notNull(),
  issueDate: timestamp('issue_date', { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const billingInvoicesRelations = relations(billingInvoices, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [billingInvoices.workOrderId],
    references: [workOrders.id],
  }),
  facility: one(clientFacilities, {
    fields: [billingInvoices.clientFacilityId],
    references: [clientFacilities.id],
  }),
  clerk: one(users, {
    fields: [billingInvoices.clerkId],
    references: [users.id],
  }),
}));
