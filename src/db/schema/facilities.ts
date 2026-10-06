import { pgTable, uuid, varchar, text, doublePrecision, integer, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const clientFacilities = pgTable('client_facilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  facilityName: varchar('facility_name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  geofenceRadius: doublePrecision('geofence_radius').default(100.0).notNull(),
  contactPersonName: varchar('contact_person_name', { length: 255 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 50 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  contractStartDate: timestamp('contract_start_date', { withTimezone: true }),
  contractEndDate: timestamp('contract_end_date', { withTimezone: true }),
  slaResponseHours: integer('sla_response_hours').default(4).notNull(),
  contractHourlyRate: numeric('contract_hourly_rate', { precision: 10, scale: 2 }).default('75.00').notNull(),
  partsMarkupPercent: numeric('parts_markup_percent', { precision: 5, scale: 2 }).default('15.00').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const clientFacilitiesRelations = relations(clientFacilities, ({ many }) => ({
  workOrders: many(clientFacilities),
}));
