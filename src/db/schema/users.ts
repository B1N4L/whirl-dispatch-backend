import { pgTable, uuid, varchar, text, numeric, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', [
  'TECHNICIAN',
  'LEAD_TECHNICIAN',
  'SUPERVISOR',
  'PAYMENT_CLERK',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  role: userRoleEnum('role').default('TECHNICIAN').notNull(),
  hourlyLaborRate: numeric('hourly_labor_rate', { precision: 10, scale: 2 }).default('50.00').notNull(),
  biometricEnrolled: boolean('biometric_enrolled').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  supervisedWorkOrders: many(users), // placeholder, wired in workOrdersRelations
}));
