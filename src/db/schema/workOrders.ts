import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { clientFacilities } from './facilities.js';
import { fleetAssets } from './fleet.js';

export const workOrderPriorityEnum = pgEnum('work_order_priority', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL_EMERGENCY',
]);

export const workOrderStatusEnum = pgEnum('work_order_status', [
  'DISPATCHED',
  'EN_ROUTE',
  'ON_SITE_ACTIVE',
  'UNACKNOWLEDGED_BREAK',
  'AWAITING_PARTS_APPROVAL',
  'COMPLETED',
  'BILLED',
  'CANCELLED',
]);

export const workOrders = pgTable('work_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  workOrderNumber: varchar('work_order_number', { length: 50 }).notNull().unique(),
  clientFacilityId: uuid('client_facility_id')
    .references(() => clientFacilities.id, { onDelete: 'cascade' })
    .notNull(),
  supervisorId: uuid('supervisor_id')
    .references(() => users.id)
    .notNull(),
  leadTechnicianId: uuid('lead_technician_id')
    .references(() => users.id)
    .notNull(),
  assignedFleetAssetId: uuid('assigned_fleet_asset_id').references(() => fleetAssets.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  priority: workOrderPriorityEnum('priority').default('MEDIUM').notNull(),
  status: workOrderStatusEnum('status').default('DISPATCHED').notNull(),
  scheduledStartTime: timestamp('scheduled_start_time', { withTimezone: true }).notNull(),
  scheduledEndTime: timestamp('scheduled_end_time', { withTimezone: true }).notNull(),
  actualStartTime: timestamp('actual_start_time', { withTimezone: true }),
  actualEndTime: timestamp('actual_end_time', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workOrderAssignments = pgTable('work_order_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  workOrderId: uuid('work_order_id')
    .references(() => workOrders.id, { onDelete: 'cascade' })
    .notNull(),
  technicianId: uuid('technician_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  facility: one(clientFacilities, {
    fields: [workOrders.clientFacilityId],
    references: [clientFacilities.id],
  }),
  supervisor: one(users, {
    fields: [workOrders.supervisorId],
    references: [users.id],
    relationName: 'supervisorWorkOrders',
  }),
  leadTechnician: one(users, {
    fields: [workOrders.leadTechnicianId],
    references: [users.id],
    relationName: 'leadTechWorkOrders',
  }),
  fleetAsset: one(fleetAssets, {
    fields: [workOrders.assignedFleetAssetId],
    references: [fleetAssets.id],
  }),
  assignments: many(workOrderAssignments),
}));

export const workOrderAssignmentsRelations = relations(workOrderAssignments, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderAssignments.workOrderId],
    references: [workOrders.id],
  }),
  technician: one(users, {
    fields: [workOrderAssignments.technicianId],
    references: [users.id],
  }),
}));
