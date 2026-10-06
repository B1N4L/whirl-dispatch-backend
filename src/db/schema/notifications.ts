import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { workOrders } from './workOrders.js';

export const notificationTypeEnum = pgEnum('notification_type', [
  'URGENT_DISPATCH',
  'GEOFENCE_BREACH_ALERT',
  'EXPENSE_THRESHOLD_ALERT',
  'EXPENSE_APPROVED',
  'JOB_COMPLETED',
]);

export const systemNotifications = pgTable('system_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipientUserId: uuid('recipient_user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  workOrderId: uuid('work_order_id').references(() => workOrders.id, { onDelete: 'set null' }),
  notificationType: notificationTypeEnum('notification_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const systemNotificationsRelations = relations(systemNotifications, ({ one }) => ({
  recipient: one(users, {
    fields: [systemNotifications.recipientUserId],
    references: [users.id],
  }),
  workOrder: one(workOrders, {
    fields: [systemNotifications.workOrderId],
    references: [workOrders.id],
  }),
}));
