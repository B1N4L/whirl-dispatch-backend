import { pgTable, uuid, varchar, text, numeric, boolean, timestamp, doublePrecision, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workOrders } from './workOrders';
import { users } from './users';

export const checklistCategoryEnum = pgEnum('checklist_category', [
  'COMPRESSOR_SYSTEM',
  'REFRIGERANT_CIRCUIT',
  'ELECTRICAL_CONTROLS',
  'CONDENSER_AIR_FLOW',
]);

export const photoTypeEnum = pgEnum('photo_type', [
  'BASELINE_BEFORE',
  'POST_SERVICE_AFTER',
  'DEFECT_EVIDENCE',
  'REPLACED_PART',
]);

export const diagnosticDossiers = pgTable('diagnostic_dossiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  workOrderId: uuid('work_order_id')
    .references(() => workOrders.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  leadTechnicianId: uuid('lead_technician_id')
    .references(() => users.id)
    .notNull(),
  equipmentModel: varchar('equipment_model', { length: 255 }).notNull(),
  equipmentSerialNumber: varchar('equipment_serial_number', { length: 100 }),
  baselineSuctionPressurePsi: numeric('baseline_suction_pressure_psi', { precision: 8, scale: 2 }),
  postServiceSuctionPressurePsi: numeric('post_service_suction_pressure_psi', { precision: 8, scale: 2 }),
  baselineDischargePressurePsi: numeric('baseline_discharge_pressure_psi', { precision: 8, scale: 2 }),
  postServiceDischargePressurePsi: numeric('post_service_discharge_pressure_psi', { precision: 8, scale: 2 }),
  baselineMotorRunningAmps: numeric('baseline_motor_running_amps', { precision: 8, scale: 2 }),
  postServiceMotorRunningAmps: numeric('post_service_motor_running_amps', { precision: 8, scale: 2 }),
  baselineCoilTempDifferential: numeric('baseline_coil_temp_differential', { precision: 8, scale: 2 }),
  postServiceCoilTempDifferential: numeric('post_service_coil_temp_differential', { precision: 8, scale: 2 }),
  diagnosticNotes: text('diagnostic_notes'),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const checklistItems = pgTable('checklist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  diagnosticDossierId: uuid('diagnostic_dossier_id')
    .references(() => diagnosticDossiers.id, { onDelete: 'cascade' })
    .notNull(),
  category: checklistCategoryEnum('category').notNull(),
  itemLabel: varchar('item_label', { length: 255 }).notNull(),
  isChecked: boolean('is_checked').default(false).notNull(),
  notes: text('notes'),
});

export const proofPhotos = pgTable('proof_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  diagnosticDossierId: uuid('diagnostic_dossier_id')
    .references(() => diagnosticDossiers.id, { onDelete: 'cascade' })
    .notNull(),
  photoType: photoTypeEnum('photo_type').notNull(),
  photoUrl: text('photo_url').notNull(),
  capturedTimestamp: timestamp('captured_timestamp', { withTimezone: true }).defaultNow().notNull(),
  capturedLatitude: doublePrecision('captured_latitude').notNull(),
  capturedLongitude: doublePrecision('captured_longitude').notNull(),
  isLiveCameraCaptured: boolean('is_live_camera_captured').default(true).notNull(),
});

export const diagnosticDossiersRelations = relations(diagnosticDossiers, ({ one, many }) => ({
  workOrder: one(workOrders, {
    fields: [diagnosticDossiers.workOrderId],
    references: [workOrders.id],
  }),
  leadTechnician: one(users, {
    fields: [diagnosticDossiers.leadTechnicianId],
    references: [users.id],
  }),
  checklistItems: many(checklistItems),
  proofPhotos: many(proofPhotos),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  dossier: one(diagnosticDossiers, {
    fields: [checklistItems.diagnosticDossierId],
    references: [diagnosticDossiers.id],
  }),
}));

export const proofPhotosRelations = relations(proofPhotos, ({ one }) => ({
  dossier: one(diagnosticDossiers, {
    fields: [proofPhotos.diagnosticDossierId],
    references: [diagnosticDossiers.id],
  }),
}));
