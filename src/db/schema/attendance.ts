import { pgTable, uuid, timestamp, integer, boolean, doublePrecision, text, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workOrders } from './workOrders.js';
import { users } from './users.js';

export const sessionStatusEnum = pgEnum('session_status', [
  'CLOCKED_IN',
  'ACTIVE_ON_SITE',
  'ON_BREAK_VIOLATION',
  'CLOCKED_OUT',
]);

export const geofenceEventTypeEnum = pgEnum('geofence_event_type', [
  'GEOFENCE_ENTER',
  'GEOFENCE_EXIT_BREACH',
  'BREAK_PAUSED',
  'BIOMETRIC_REAUTH_RESUME',
  'SUPERVISOR_OVERRIDE',
]);

export const siteAttendance = pgTable('site_attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  workOrderId: uuid('work_order_id')
    .references(() => workOrders.id, { onDelete: 'cascade' })
    .notNull(),
  technicianId: uuid('technician_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  clockInTimestamp: timestamp('clock_in_timestamp', { withTimezone: true }).notNull(),
  clockOutTimestamp: timestamp('clock_out_timestamp', { withTimezone: true }),
  totalBillableSeconds: integer('total_billable_seconds').default(0).notNull(),
  totalBreakSeconds: integer('total_break_seconds').default(0).notNull(),
  sessionStatus: sessionStatusEnum('session_status').default('CLOCKED_IN').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const geofenceAuditLogs = pgTable('geofence_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workOrderId: uuid('work_order_id')
    .references(() => workOrders.id, { onDelete: 'cascade' })
    .notNull(),
  technicianId: uuid('technician_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  siteAttendanceId: uuid('site_attendance_id').references(() => siteAttendance.id, { onDelete: 'set null' }),
  eventType: geofenceEventTypeEnum('event_type').notNull(),
  recordedTimestamp: timestamp('recorded_timestamp', { withTimezone: true }).defaultNow().notNull(),
  deviceLatitude: doublePrecision('device_latitude').notNull(),
  deviceLongitude: doublePrecision('device_longitude').notNull(),
  accuracyMeters: doublePrecision('accuracy_meters').default(5.0).notNull(),
  isTamperVerified: boolean('is_tamper_verified').default(true).notNull(),
  notes: text('notes'),
});

export const siteAttendanceRelations = relations(siteAttendance, ({ one, many }) => ({
  workOrder: one(workOrders, {
    fields: [siteAttendance.workOrderId],
    references: [workOrders.id],
  }),
  technician: one(users, {
    fields: [siteAttendance.technicianId],
    references: [users.id],
  }),
  auditLogs: many(geofenceAuditLogs),
}));

export const geofenceAuditLogsRelations = relations(geofenceAuditLogs, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [geofenceAuditLogs.workOrderId],
    references: [workOrders.id],
  }),
  technician: one(users, {
    fields: [geofenceAuditLogs.technicianId],
    references: [users.id],
  }),
  siteAttendance: one(siteAttendance, {
    fields: [geofenceAuditLogs.siteAttendanceId],
    references: [siteAttendance.id],
  }),
}));
