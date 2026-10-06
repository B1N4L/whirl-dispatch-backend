import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const assetTypeEnum = pgEnum('asset_type', [
  'VAN',
  'CRANE_TRUCK',
  'SERVICE_TRUCK',
  'RECOVERY_TRAILER',
]);

export const assetStatusEnum = pgEnum('asset_status', [
  'AVAILABLE',
  'DEPLOYED',
  'UNDER_MAINTENANCE',
]);

export const fleetAssets = pgTable('fleet_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  assetCode: varchar('asset_code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  assetType: assetTypeEnum('asset_type').default('VAN').notNull(),
  licensePlate: varchar('license_plate', { length: 50 }).notNull(),
  status: assetStatusEnum('status').default('AVAILABLE').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fleetAssetsRelations = relations(fleetAssets, ({ many }) => ({
  assignedWorkOrders: many(fleetAssets),
}));
