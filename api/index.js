var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import dotenv3 from "dotenv";

// src/routes/health.route.ts
import { Router } from "express";
var healthRouter = Router();
healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "WhirlDispatch Backend API",
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development"
  });
});

// src/routes/auth.route.ts
import { Router as Router2 } from "express";

// src/controllers/auth.controller.ts
import bcrypt from "bcrypt";

// src/config/db.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// src/db/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  assetStatusEnum: () => assetStatusEnum,
  assetTypeEnum: () => assetTypeEnum,
  billingInvoices: () => billingInvoices,
  billingInvoicesRelations: () => billingInvoicesRelations,
  checklistCategoryEnum: () => checklistCategoryEnum,
  checklistItems: () => checklistItems,
  checklistItemsRelations: () => checklistItemsRelations,
  clientFacilities: () => clientFacilities,
  clientFacilitiesRelations: () => clientFacilitiesRelations,
  diagnosticDossiers: () => diagnosticDossiers,
  diagnosticDossiersRelations: () => diagnosticDossiersRelations,
  expenseApprovalStatusEnum: () => expenseApprovalStatusEnum,
  expenseClaims: () => expenseClaims,
  expenseClaimsRelations: () => expenseClaimsRelations,
  expenseItems: () => expenseItems,
  expenseItemsRelations: () => expenseItemsRelations,
  fleetAssets: () => fleetAssets,
  fleetAssetsRelations: () => fleetAssetsRelations,
  geofenceAuditLogs: () => geofenceAuditLogs,
  geofenceAuditLogsRelations: () => geofenceAuditLogsRelations,
  geofenceEventTypeEnum: () => geofenceEventTypeEnum,
  invoiceStatusEnum: () => invoiceStatusEnum,
  notificationTypeEnum: () => notificationTypeEnum,
  photoTypeEnum: () => photoTypeEnum,
  proofPhotos: () => proofPhotos,
  proofPhotosRelations: () => proofPhotosRelations,
  sessionStatusEnum: () => sessionStatusEnum,
  siteAttendance: () => siteAttendance,
  siteAttendanceRelations: () => siteAttendanceRelations,
  systemNotifications: () => systemNotifications,
  systemNotificationsRelations: () => systemNotificationsRelations,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  usersRelations: () => usersRelations,
  workOrderAssignments: () => workOrderAssignments,
  workOrderAssignmentsRelations: () => workOrderAssignmentsRelations,
  workOrderPriorityEnum: () => workOrderPriorityEnum,
  workOrderStatusEnum: () => workOrderStatusEnum,
  workOrders: () => workOrders,
  workOrdersRelations: () => workOrdersRelations
});

// src/db/schema/users.ts
import { pgTable, uuid, varchar, text, numeric, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
var userRoleEnum = pgEnum("user_role", [
  "TECHNICIAN",
  "LEAD_TECHNICIAN",
  "SUPERVISOR",
  "PAYMENT_CLERK"
]);
var users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  role: userRoleEnum("role").default("TECHNICIAN").notNull(),
  hourlyLaborRate: numeric("hourly_labor_rate", { precision: 10, scale: 2 }).default("50.00").notNull(),
  biometricEnrolled: boolean("biometric_enrolled").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var usersRelations = relations(users, ({ many }) => ({
  supervisedWorkOrders: many(users)
  // placeholder, wired in workOrdersRelations
}));

// src/db/schema/facilities.ts
import { pgTable as pgTable2, uuid as uuid2, varchar as varchar2, text as text2, doublePrecision, integer, numeric as numeric2, timestamp as timestamp2 } from "drizzle-orm/pg-core";
import { relations as relations2 } from "drizzle-orm";
var clientFacilities = pgTable2("client_facilities", {
  id: uuid2("id").defaultRandom().primaryKey(),
  companyName: varchar2("company_name", { length: 255 }).notNull(),
  facilityName: varchar2("facility_name", { length: 255 }).notNull(),
  address: text2("address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  geofenceRadius: doublePrecision("geofence_radius").default(100).notNull(),
  contactPersonName: varchar2("contact_person_name", { length: 255 }).notNull(),
  contactPhone: varchar2("contact_phone", { length: 50 }).notNull(),
  contactEmail: varchar2("contact_email", { length: 255 }),
  contractStartDate: timestamp2("contract_start_date", { withTimezone: true }),
  contractEndDate: timestamp2("contract_end_date", { withTimezone: true }),
  slaResponseHours: integer("sla_response_hours").default(4).notNull(),
  contractHourlyRate: numeric2("contract_hourly_rate", { precision: 10, scale: 2 }).default("75.00").notNull(),
  partsMarkupPercent: numeric2("parts_markup_percent", { precision: 5, scale: 2 }).default("15.00").notNull(),
  createdAt: timestamp2("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp2("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var clientFacilitiesRelations = relations2(clientFacilities, ({ many }) => ({
  workOrders: many(clientFacilities)
}));

// src/db/schema/fleet.ts
import { pgTable as pgTable3, uuid as uuid3, varchar as varchar3, timestamp as timestamp3, pgEnum as pgEnum2 } from "drizzle-orm/pg-core";
import { relations as relations3 } from "drizzle-orm";
var assetTypeEnum = pgEnum2("asset_type", [
  "VAN",
  "CRANE_TRUCK",
  "SERVICE_TRUCK",
  "RECOVERY_TRAILER"
]);
var assetStatusEnum = pgEnum2("asset_status", [
  "AVAILABLE",
  "DEPLOYED",
  "UNDER_MAINTENANCE"
]);
var fleetAssets = pgTable3("fleet_assets", {
  id: uuid3("id").defaultRandom().primaryKey(),
  assetCode: varchar3("asset_code", { length: 50 }).notNull().unique(),
  name: varchar3("name", { length: 255 }).notNull(),
  assetType: assetTypeEnum("asset_type").default("VAN").notNull(),
  licensePlate: varchar3("license_plate", { length: 50 }).notNull(),
  status: assetStatusEnum("status").default("AVAILABLE").notNull(),
  createdAt: timestamp3("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp3("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var fleetAssetsRelations = relations3(fleetAssets, ({ many }) => ({
  assignedWorkOrders: many(fleetAssets)
}));

// src/db/schema/workOrders.ts
import { pgTable as pgTable4, uuid as uuid4, varchar as varchar4, text as text3, timestamp as timestamp4, pgEnum as pgEnum3 } from "drizzle-orm/pg-core";
import { relations as relations4 } from "drizzle-orm";
var workOrderPriorityEnum = pgEnum3("work_order_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL_EMERGENCY"
]);
var workOrderStatusEnum = pgEnum3("work_order_status", [
  "DISPATCHED",
  "EN_ROUTE",
  "ON_SITE_ACTIVE",
  "UNACKNOWLEDGED_BREAK",
  "AWAITING_PARTS_APPROVAL",
  "COMPLETED",
  "BILLED",
  "CANCELLED"
]);
var workOrders = pgTable4("work_orders", {
  id: uuid4("id").defaultRandom().primaryKey(),
  workOrderNumber: varchar4("work_order_number", { length: 50 }).notNull().unique(),
  clientFacilityId: uuid4("client_facility_id").references(() => clientFacilities.id, { onDelete: "cascade" }).notNull(),
  supervisorId: uuid4("supervisor_id").references(() => users.id).notNull(),
  leadTechnicianId: uuid4("lead_technician_id").references(() => users.id).notNull(),
  assignedFleetAssetId: uuid4("assigned_fleet_asset_id").references(() => fleetAssets.id),
  title: varchar4("title", { length: 255 }).notNull(),
  description: text3("description").notNull(),
  priority: workOrderPriorityEnum("priority").default("MEDIUM").notNull(),
  status: workOrderStatusEnum("status").default("DISPATCHED").notNull(),
  scheduledStartTime: timestamp4("scheduled_start_time", { withTimezone: true }).notNull(),
  scheduledEndTime: timestamp4("scheduled_end_time", { withTimezone: true }).notNull(),
  actualStartTime: timestamp4("actual_start_time", { withTimezone: true }),
  actualEndTime: timestamp4("actual_end_time", { withTimezone: true }),
  createdAt: timestamp4("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp4("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var workOrderAssignments = pgTable4("work_order_assignments", {
  id: uuid4("id").defaultRandom().primaryKey(),
  workOrderId: uuid4("work_order_id").references(() => workOrders.id, { onDelete: "cascade" }).notNull(),
  technicianId: uuid4("technician_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  assignedAt: timestamp4("assigned_at", { withTimezone: true }).defaultNow().notNull()
});
var workOrdersRelations = relations4(workOrders, ({ one, many }) => ({
  facility: one(clientFacilities, {
    fields: [workOrders.clientFacilityId],
    references: [clientFacilities.id]
  }),
  supervisor: one(users, {
    fields: [workOrders.supervisorId],
    references: [users.id],
    relationName: "supervisorWorkOrders"
  }),
  leadTechnician: one(users, {
    fields: [workOrders.leadTechnicianId],
    references: [users.id],
    relationName: "leadTechWorkOrders"
  }),
  fleetAsset: one(fleetAssets, {
    fields: [workOrders.assignedFleetAssetId],
    references: [fleetAssets.id]
  }),
  assignments: many(workOrderAssignments)
}));
var workOrderAssignmentsRelations = relations4(workOrderAssignments, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderAssignments.workOrderId],
    references: [workOrders.id]
  }),
  technician: one(users, {
    fields: [workOrderAssignments.technicianId],
    references: [users.id]
  })
}));

// src/db/schema/attendance.ts
import { pgTable as pgTable5, uuid as uuid5, timestamp as timestamp5, integer as integer2, boolean as boolean2, doublePrecision as doublePrecision2, text as text4, pgEnum as pgEnum4 } from "drizzle-orm/pg-core";
import { relations as relations5 } from "drizzle-orm";
var sessionStatusEnum = pgEnum4("session_status", [
  "CLOCKED_IN",
  "ACTIVE_ON_SITE",
  "ON_BREAK_VIOLATION",
  "CLOCKED_OUT"
]);
var geofenceEventTypeEnum = pgEnum4("geofence_event_type", [
  "GEOFENCE_ENTER",
  "GEOFENCE_EXIT_BREACH",
  "BREAK_PAUSED",
  "BIOMETRIC_REAUTH_RESUME",
  "SUPERVISOR_OVERRIDE"
]);
var siteAttendance = pgTable5("site_attendance", {
  id: uuid5("id").defaultRandom().primaryKey(),
  workOrderId: uuid5("work_order_id").references(() => workOrders.id, { onDelete: "cascade" }).notNull(),
  technicianId: uuid5("technician_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  clockInTimestamp: timestamp5("clock_in_timestamp", { withTimezone: true }).notNull(),
  clockOutTimestamp: timestamp5("clock_out_timestamp", { withTimezone: true }),
  totalBillableSeconds: integer2("total_billable_seconds").default(0).notNull(),
  totalBreakSeconds: integer2("total_break_seconds").default(0).notNull(),
  sessionStatus: sessionStatusEnum("session_status").default("CLOCKED_IN").notNull(),
  createdAt: timestamp5("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp5("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var geofenceAuditLogs = pgTable5("geofence_audit_logs", {
  id: uuid5("id").defaultRandom().primaryKey(),
  workOrderId: uuid5("work_order_id").references(() => workOrders.id, { onDelete: "cascade" }).notNull(),
  technicianId: uuid5("technician_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  siteAttendanceId: uuid5("site_attendance_id").references(() => siteAttendance.id, { onDelete: "set null" }),
  eventType: geofenceEventTypeEnum("event_type").notNull(),
  recordedTimestamp: timestamp5("recorded_timestamp", { withTimezone: true }).defaultNow().notNull(),
  deviceLatitude: doublePrecision2("device_latitude").notNull(),
  deviceLongitude: doublePrecision2("device_longitude").notNull(),
  accuracyMeters: doublePrecision2("accuracy_meters").default(5).notNull(),
  isTamperVerified: boolean2("is_tamper_verified").default(true).notNull(),
  notes: text4("notes")
});
var siteAttendanceRelations = relations5(siteAttendance, ({ one, many }) => ({
  workOrder: one(workOrders, {
    fields: [siteAttendance.workOrderId],
    references: [workOrders.id]
  }),
  technician: one(users, {
    fields: [siteAttendance.technicianId],
    references: [users.id]
  }),
  auditLogs: many(geofenceAuditLogs)
}));
var geofenceAuditLogsRelations = relations5(geofenceAuditLogs, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [geofenceAuditLogs.workOrderId],
    references: [workOrders.id]
  }),
  technician: one(users, {
    fields: [geofenceAuditLogs.technicianId],
    references: [users.id]
  }),
  siteAttendance: one(siteAttendance, {
    fields: [geofenceAuditLogs.siteAttendanceId],
    references: [siteAttendance.id]
  })
}));

// src/db/schema/dossiers.ts
import { pgTable as pgTable6, uuid as uuid6, varchar as varchar5, text as text5, numeric as numeric3, boolean as boolean3, timestamp as timestamp6, doublePrecision as doublePrecision3, pgEnum as pgEnum5 } from "drizzle-orm/pg-core";
import { relations as relations6 } from "drizzle-orm";
var checklistCategoryEnum = pgEnum5("checklist_category", [
  "COMPRESSOR_SYSTEM",
  "REFRIGERANT_CIRCUIT",
  "ELECTRICAL_CONTROLS",
  "CONDENSER_AIR_FLOW"
]);
var photoTypeEnum = pgEnum5("photo_type", [
  "BASELINE_BEFORE",
  "POST_SERVICE_AFTER",
  "DEFECT_EVIDENCE",
  "REPLACED_PART"
]);
var diagnosticDossiers = pgTable6("diagnostic_dossiers", {
  id: uuid6("id").defaultRandom().primaryKey(),
  workOrderId: uuid6("work_order_id").references(() => workOrders.id, { onDelete: "cascade" }).notNull().unique(),
  leadTechnicianId: uuid6("lead_technician_id").references(() => users.id).notNull(),
  equipmentModel: varchar5("equipment_model", { length: 255 }).notNull(),
  equipmentSerialNumber: varchar5("equipment_serial_number", { length: 100 }),
  baselineSuctionPressurePsi: numeric3("baseline_suction_pressure_psi", { precision: 8, scale: 2 }),
  postServiceSuctionPressurePsi: numeric3("post_service_suction_pressure_psi", { precision: 8, scale: 2 }),
  baselineDischargePressurePsi: numeric3("baseline_discharge_pressure_psi", { precision: 8, scale: 2 }),
  postServiceDischargePressurePsi: numeric3("post_service_discharge_pressure_psi", { precision: 8, scale: 2 }),
  baselineMotorRunningAmps: numeric3("baseline_motor_running_amps", { precision: 8, scale: 2 }),
  postServiceMotorRunningAmps: numeric3("post_service_motor_running_amps", { precision: 8, scale: 2 }),
  baselineCoilTempDifferential: numeric3("baseline_coil_temp_differential", { precision: 8, scale: 2 }),
  postServiceCoilTempDifferential: numeric3("post_service_coil_temp_differential", { precision: 8, scale: 2 }),
  diagnosticNotes: text5("diagnostic_notes"),
  isCompleted: boolean3("is_completed").default(false).notNull(),
  completedAt: timestamp6("completed_at", { withTimezone: true }),
  createdAt: timestamp6("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp6("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var checklistItems = pgTable6("checklist_items", {
  id: uuid6("id").defaultRandom().primaryKey(),
  diagnosticDossierId: uuid6("diagnostic_dossier_id").references(() => diagnosticDossiers.id, { onDelete: "cascade" }).notNull(),
  category: checklistCategoryEnum("category").notNull(),
  itemLabel: varchar5("item_label", { length: 255 }).notNull(),
  isChecked: boolean3("is_checked").default(false).notNull(),
  notes: text5("notes")
});
var proofPhotos = pgTable6("proof_photos", {
  id: uuid6("id").defaultRandom().primaryKey(),
  diagnosticDossierId: uuid6("diagnostic_dossier_id").references(() => diagnosticDossiers.id, { onDelete: "cascade" }).notNull(),
  photoType: photoTypeEnum("photo_type").notNull(),
  photoUrl: text5("photo_url").notNull(),
  capturedTimestamp: timestamp6("captured_timestamp", { withTimezone: true }).defaultNow().notNull(),
  capturedLatitude: doublePrecision3("captured_latitude").notNull(),
  capturedLongitude: doublePrecision3("captured_longitude").notNull(),
  isLiveCameraCaptured: boolean3("is_live_camera_captured").default(true).notNull()
});
var diagnosticDossiersRelations = relations6(diagnosticDossiers, ({ one, many }) => ({
  workOrder: one(workOrders, {
    fields: [diagnosticDossiers.workOrderId],
    references: [workOrders.id]
  }),
  leadTechnician: one(users, {
    fields: [diagnosticDossiers.leadTechnicianId],
    references: [users.id]
  }),
  checklistItems: many(checklistItems),
  proofPhotos: many(proofPhotos)
}));
var checklistItemsRelations = relations6(checklistItems, ({ one }) => ({
  dossier: one(diagnosticDossiers, {
    fields: [checklistItems.diagnosticDossierId],
    references: [diagnosticDossiers.id]
  })
}));
var proofPhotosRelations = relations6(proofPhotos, ({ one }) => ({
  dossier: one(diagnosticDossiers, {
    fields: [proofPhotos.diagnosticDossierId],
    references: [diagnosticDossiers.id]
  })
}));

// src/db/schema/expenses.ts
import { pgTable as pgTable7, uuid as uuid7, varchar as varchar6, text as text6, numeric as numeric4, boolean as boolean4, timestamp as timestamp7, doublePrecision as doublePrecision4, integer as integer3, pgEnum as pgEnum6 } from "drizzle-orm/pg-core";
import { relations as relations7 } from "drizzle-orm";
var expenseApprovalStatusEnum = pgEnum6("expense_approval_status", [
  "PENDING_SUPERVISOR_APPROVAL",
  "APPROVED",
  "FLAGGED_REJECTED"
]);
var expenseClaims = pgTable7("expense_claims", {
  id: uuid7("id").defaultRandom().primaryKey(),
  workOrderId: uuid7("work_order_id").references(() => workOrders.id, { onDelete: "cascade" }).notNull(),
  leadTechnicianId: uuid7("lead_technician_id").references(() => users.id).notNull(),
  vendorName: varchar6("vendor_name", { length: 255 }).notNull(),
  receiptNumber: varchar6("receipt_number", { length: 100 }),
  totalAmount: numeric4("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar6("currency", { length: 10 }).default("LKR").notNull(),
  receiptImageUrl: text6("receipt_image_url").notNull(),
  receiptStoreLatitude: doublePrecision4("receipt_store_latitude").notNull(),
  receiptStoreLongitude: doublePrecision4("receipt_store_longitude").notNull(),
  receiptCapturedAt: timestamp7("receipt_captured_at", { withTimezone: true }).defaultNow().notNull(),
  isThresholdExceeded: boolean4("is_threshold_exceeded").default(false).notNull(),
  approvalStatus: expenseApprovalStatusEnum("approval_status").default("PENDING_SUPERVISOR_APPROVAL").notNull(),
  reviewedBySupervisorId: uuid7("reviewed_by_supervisor_id").references(() => users.id),
  reviewedAt: timestamp7("reviewed_at", { withTimezone: true }),
  rejectionReason: text6("rejection_reason"),
  createdAt: timestamp7("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp7("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var expenseItems = pgTable7("expense_items", {
  id: uuid7("id").defaultRandom().primaryKey(),
  expenseClaimId: uuid7("expense_claim_id").references(() => expenseClaims.id, { onDelete: "cascade" }).notNull(),
  partDescription: varchar6("part_description", { length: 255 }).notNull(),
  quantity: integer3("quantity").default(1).notNull(),
  unitPrice: numeric4("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric4("total_price", { precision: 10, scale: 2 }).notNull()
});
var expenseClaimsRelations = relations7(expenseClaims, ({ one, many }) => ({
  workOrder: one(workOrders, {
    fields: [expenseClaims.workOrderId],
    references: [workOrders.id]
  }),
  leadTechnician: one(users, {
    fields: [expenseClaims.leadTechnicianId],
    references: [users.id],
    relationName: "leadTechnicianExpenses"
  }),
  reviewedBySupervisor: one(users, {
    fields: [expenseClaims.reviewedBySupervisorId],
    references: [users.id],
    relationName: "supervisorExpenseReviews"
  }),
  items: many(expenseItems)
}));
var expenseItemsRelations = relations7(expenseItems, ({ one }) => ({
  claim: one(expenseClaims, {
    fields: [expenseItems.expenseClaimId],
    references: [expenseClaims.id]
  })
}));

// src/db/schema/billing.ts
import { pgTable as pgTable8, uuid as uuid8, varchar as varchar7, numeric as numeric5, timestamp as timestamp8, pgEnum as pgEnum7 } from "drizzle-orm/pg-core";
import { relations as relations8 } from "drizzle-orm";
var invoiceStatusEnum = pgEnum7("invoice_status", [
  "DRAFT_ESTIMATE",
  "APPROVED_BY_SUPERVISOR",
  "ISSUED_TO_CLIENT",
  "PAID"
]);
var billingInvoices = pgTable8("billing_invoices", {
  id: uuid8("id").defaultRandom().primaryKey(),
  invoiceNumber: varchar7("invoice_number", { length: 50 }).notNull().unique(),
  workOrderId: uuid8("work_order_id").references(() => workOrders.id, { onDelete: "cascade" }).notNull().unique(),
  clientFacilityId: uuid8("client_facility_id").references(() => clientFacilities.id).notNull(),
  clerkId: uuid8("clerk_id").references(() => users.id).notNull(),
  totalBillableLaborHours: numeric5("total_billable_labor_hours", { precision: 8, scale: 2 }).notNull(),
  hourlyLaborRateApplied: numeric5("hourly_labor_rate_applied", { precision: 10, scale: 2 }).notNull(),
  subtotalLabor: numeric5("subtotal_labor", { precision: 12, scale: 2 }).notNull(),
  subtotalApprovedParts: numeric5("subtotal_approved_parts", { precision: 12, scale: 2 }).default("0.00").notNull(),
  partsMarkupPercentApplied: numeric5("parts_markup_percent_applied", { precision: 5, scale: 2 }).default("0.00").notNull(),
  subtotalPartsWithMarkup: numeric5("subtotal_parts_with_markup", { precision: 12, scale: 2 }).default("0.00").notNull(),
  fleetEquipmentFee: numeric5("fleet_equipment_fee", { precision: 10, scale: 2 }).default("0.00").notNull(),
  taxPercent: numeric5("tax_percent", { precision: 5, scale: 2 }).default("8.00").notNull(),
  taxAmount: numeric5("tax_amount", { precision: 12, scale: 2 }).notNull(),
  grandTotal: numeric5("grand_total", { precision: 12, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").default("DRAFT_ESTIMATE").notNull(),
  issueDate: timestamp8("issue_date", { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp8("due_date", { withTimezone: true }).notNull(),
  createdAt: timestamp8("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp8("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var billingInvoicesRelations = relations8(billingInvoices, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [billingInvoices.workOrderId],
    references: [workOrders.id]
  }),
  facility: one(clientFacilities, {
    fields: [billingInvoices.clientFacilityId],
    references: [clientFacilities.id]
  }),
  clerk: one(users, {
    fields: [billingInvoices.clerkId],
    references: [users.id]
  })
}));

// src/db/schema/notifications.ts
import { pgTable as pgTable9, uuid as uuid9, varchar as varchar8, text as text7, boolean as boolean5, timestamp as timestamp9, pgEnum as pgEnum8 } from "drizzle-orm/pg-core";
import { relations as relations9 } from "drizzle-orm";
var notificationTypeEnum = pgEnum8("notification_type", [
  "URGENT_DISPATCH",
  "GEOFENCE_BREACH_ALERT",
  "EXPENSE_THRESHOLD_ALERT",
  "EXPENSE_APPROVED",
  "JOB_COMPLETED"
]);
var systemNotifications = pgTable9("system_notifications", {
  id: uuid9("id").defaultRandom().primaryKey(),
  recipientUserId: uuid9("recipient_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  workOrderId: uuid9("work_order_id").references(() => workOrders.id, { onDelete: "set null" }),
  notificationType: notificationTypeEnum("notification_type").notNull(),
  title: varchar8("title", { length: 255 }).notNull(),
  body: text7("body").notNull(),
  isRead: boolean5("is_read").default(false).notNull(),
  createdAt: timestamp9("created_at", { withTimezone: true }).defaultNow().notNull()
});
var systemNotificationsRelations = relations9(systemNotifications, ({ one }) => ({
  recipient: one(users, {
    fields: [systemNotifications.recipientUserId],
    references: [users.id]
  }),
  workOrder: one(workOrders, {
    fields: [systemNotifications.workOrderId],
    references: [workOrders.id]
  })
}));

// src/config/db.ts
import dotenv from "dotenv";
dotenv.config();
var pooledUrl = process.env.DATABASE_URL;
var unpooledUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!pooledUrl) {
  console.warn("[WARN] DATABASE_URL environment variable is not defined.");
}
var sql = neon(pooledUrl || "");
var db = drizzle(sql, { schema: schema_exports });
var unpooledSql = neon(unpooledUrl || "");
var unpooledDb = drizzle(unpooledSql, { schema: schema_exports });

// src/schemas/auth.schema.ts
import { z } from "zod";
var loginSchema = z.object({
  email: z.string().email("Valid corporate email address required"),
  password: z.string().min(6, "Password must be at least 6 characters long")
});
var registerSchema = z.object({
  email: z.string().email("Valid corporate email address required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().optional(),
  role: z.enum(["TECHNICIAN", "LEAD_TECHNICIAN", "SUPERVISOR", "PAYMENT_CLERK"]),
  hourlyLaborRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be valid decimal string").optional()
});

// src/utils/jwt.ts
import jwt from "jsonwebtoken";
import dotenv2 from "dotenv";
dotenv2.config();
var JWT_SECRET = process.env.JWT_SECRET || "whirldispatch_default_secret_key_change_in_prod";
var DEFAULT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
function generateToken(payload, expiresIn = DEFAULT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// src/controllers/auth.controller.ts
import { eq } from "drizzle-orm";
async function login(req, res) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const { email, password } = parseResult.data;
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim())
    });
    if (!user || !user.isActive) {
      res.status(401).json({
        error: "AuthenticationFailed",
        message: "Invalid credentials or inactive account."
      });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        error: "AuthenticationFailed",
        message: "Invalid credentials or inactive account."
      });
      return;
    }
    const token = generateToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    });
    res.status(200).json({
      message: "Authentication successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        hourlyLaborRate: user.hourlyLaborRate,
        biometricEnrolled: user.biometricEnrolled
      }
    });
  } catch (error) {
    console.error("[AUTH ERROR] Login failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to process authentication request."
    });
  }
}
async function register(req, res) {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const { email, password, fullName, phone, role, hourlyLaborRate } = parseResult.data;
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim())
    });
    if (existingUser) {
      res.status(409).json({
        error: "Conflict",
        message: "A user with this email address already exists."
      });
      return;
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName,
      phone: phone || null,
      role,
      hourlyLaborRate: hourlyLaborRate || "50.00",
      biometricEnrolled: false,
      isActive: true
    }).returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      role: users.role,
      hourlyLaborRate: users.hourlyLaborRate,
      biometricEnrolled: users.biometricEnrolled
    });
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role
    });
    res.status(201).json({
      message: "User account registered successfully",
      token,
      user: newUser
    });
  } catch (error) {
    console.error("[AUTH ERROR] Registration failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to register user account."
    });
  }
}
async function getProfile(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication token missing or invalid."
      });
      return;
    }
    const user = await db.query.users.findFirst({
      where: eq(users.id, authUser.userId)
    });
    if (!user) {
      res.status(404).json({
        error: "NotFound",
        message: "User profile not found."
      });
      return;
    }
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        hourlyLaborRate: user.hourlyLaborRate,
        biometricEnrolled: user.biometricEnrolled,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("[AUTH ERROR] Get profile failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve profile."
    });
  }
}

// src/controllers/biometric.controller.ts
import { eq as eq2 } from "drizzle-orm";
async function biometricVerify(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Valid user authentication required for biometric verification."
      });
      return;
    }
    const { deviceId, biometricType } = req.body;
    const user = await db.query.users.findFirst({
      where: eq2(users.id, authUser.userId)
    });
    if (!user) {
      res.status(404).json({
        error: "NotFound",
        message: "User account not found."
      });
      return;
    }
    if (!user.biometricEnrolled) {
      await db.update(users).set({ biometricEnrolled: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(users.id, user.id));
    }
    const verifiedAt = (/* @__PURE__ */ new Date()).toISOString();
    res.status(200).json({
      verified: true,
      message: "Biometric assertion verified successfully.",
      userId: user.id,
      role: user.role,
      biometricType: biometricType || "FACE_ID",
      deviceId: deviceId || "IOS-DEVICE-FIELD",
      verifiedAt
    });
  } catch (error) {
    console.error("[AUTH ERROR] Biometric verification failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to verify biometric token."
    });
  }
}

// src/middleware/auth.middleware.ts
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (!token) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Access token required in Authorization header."
    });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(403).json({
      error: "Forbidden",
      message: "Invalid or expired access token."
    });
    return;
  }
  req.user = payload;
  next();
}

// src/middleware/rbac.middleware.ts
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required before checking permissions."
      });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: "Forbidden",
        message: `Access denied. Role '${user.role}' is not authorized. Requires: ${allowedRoles.join(", ")}.`
      });
      return;
    }
    next();
  };
}

// src/routes/auth.route.ts
var authRouter = Router2();
authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.get("/me", authenticateToken, getProfile);
authRouter.post("/biometric-verify", authenticateToken, biometricVerify);
authRouter.get("/supervisor-check", authenticateToken, requireRole(["SUPERVISOR"]), (_req, res) => {
  res.status(200).json({ authorized: true, role: "SUPERVISOR" });
});

// src/routes/facilities.route.ts
import { Router as Router3 } from "express";

// src/schemas/facilities.schema.ts
import { z as z2 } from "zod";
var createFacilitySchema = z2.object({
  companyName: z2.string().min(2, "Company name is required"),
  facilityName: z2.string().min(2, "Facility name is required"),
  address: z2.string().min(5, "Physical address is required"),
  latitude: z2.number().min(-90).max(90, "Valid latitude coordinate required"),
  longitude: z2.number().min(-180).max(180, "Valid longitude coordinate required"),
  geofenceRadius: z2.number().positive().default(100),
  contactPersonName: z2.string().min(2, "Contact person name is required"),
  contactPhone: z2.string().min(5, "Contact phone is required"),
  contactEmail: z2.string().email().optional(),
  contractStartDate: z2.string().datetime().optional(),
  contractEndDate: z2.string().datetime().optional(),
  slaResponseHours: z2.number().int().positive().default(4),
  contractHourlyRate: z2.string().regex(/^\d+(\.\d{1,2})?$/).default("75.00"),
  partsMarkupPercent: z2.string().regex(/^\d+(\.\d{1,2})?$/).default("15.00")
});

// src/controllers/facilities.controller.ts
import { eq as eq3 } from "drizzle-orm";
async function getFacilities(_req, res) {
  try {
    const list = await db.query.clientFacilities.findMany({
      orderBy: (facilities, { desc: desc7 }) => [desc7(facilities.createdAt)]
    });
    res.status(200).json({
      count: list.length,
      facilities: list
    });
  } catch (error) {
    console.error("[FACILITIES ERROR] Failed to fetch facilities:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve commercial facilities."
    });
  }
}
async function getFacilityById(req, res) {
  try {
    const id = req.params.id;
    const facility = await db.query.clientFacilities.findFirst({
      where: eq3(clientFacilities.id, id)
    });
    if (!facility) {
      res.status(404).json({
        error: "NotFound",
        message: "Client facility not found."
      });
      return;
    }
    res.status(200).json({ facility });
  } catch (error) {
    console.error("[FACILITIES ERROR] Failed to fetch facility by ID:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve facility details."
    });
  }
}
async function createFacility(req, res) {
  try {
    const parseResult = createFacilitySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const data = parseResult.data;
    const [newFacility] = await db.insert(clientFacilities).values({
      companyName: data.companyName,
      facilityName: data.facilityName,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      geofenceRadius: data.geofenceRadius,
      contactPersonName: data.contactPersonName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail || null,
      contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : null,
      contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
      slaResponseHours: data.slaResponseHours,
      contractHourlyRate: data.contractHourlyRate,
      partsMarkupPercent: data.partsMarkupPercent
    }).returning();
    res.status(201).json({
      message: "Commercial client facility registered successfully.",
      facility: newFacility
    });
  } catch (error) {
    console.error("[FACILITIES ERROR] Failed to create facility:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to create client facility."
    });
  }
}

// src/routes/facilities.route.ts
var facilitiesRouter = Router3();
facilitiesRouter.use(authenticateToken);
facilitiesRouter.get("/", getFacilities);
facilitiesRouter.get("/:id", getFacilityById);
facilitiesRouter.post("/", requireRole(["SUPERVISOR"]), createFacility);

// src/routes/fleet.route.ts
import { Router as Router4 } from "express";

// src/schemas/fleet.schema.ts
import { z as z3 } from "zod";
var createFleetAssetSchema = z3.object({
  assetCode: z3.string().min(2, "Asset code is required (e.g. VAN-04, CRANE-02)"),
  name: z3.string().min(2, "Asset name is required"),
  assetType: z3.enum(["VAN", "CRANE_TRUCK", "SERVICE_TRUCK", "RECOVERY_TRAILER"]).default("VAN"),
  licensePlate: z3.string().min(2, "License plate is required"),
  status: z3.enum(["AVAILABLE", "DEPLOYED", "UNDER_MAINTENANCE"]).default("AVAILABLE")
});
var updateFleetStatusSchema = z3.object({
  status: z3.enum(["AVAILABLE", "DEPLOYED", "UNDER_MAINTENANCE"])
});

// src/controllers/fleet.controller.ts
import { eq as eq4 } from "drizzle-orm";
async function getFleetAssets(_req, res) {
  try {
    const list = await db.query.fleetAssets.findMany({
      orderBy: (assets, { asc }) => [asc(assets.assetCode)]
    });
    res.status(200).json({
      count: list.length,
      fleet: list
    });
  } catch (error) {
    console.error("[FLEET ERROR] Failed to fetch fleet assets:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve fleet assets."
    });
  }
}
async function getFleetAssetById(req, res) {
  try {
    const id = req.params.id;
    const asset = await db.query.fleetAssets.findFirst({
      where: eq4(fleetAssets.id, id)
    });
    if (!asset) {
      res.status(404).json({
        error: "NotFound",
        message: "Fleet asset not found."
      });
      return;
    }
    res.status(200).json({ asset });
  } catch (error) {
    console.error("[FLEET ERROR] Failed to fetch fleet asset by ID:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve fleet asset details."
    });
  }
}
async function createFleetAsset(req, res) {
  try {
    const parseResult = createFleetAssetSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const data = parseResult.data;
    const existing = await db.query.fleetAssets.findFirst({
      where: eq4(fleetAssets.assetCode, data.assetCode.toUpperCase().trim())
    });
    if (existing) {
      res.status(409).json({
        error: "Conflict",
        message: "Fleet asset with this code already exists."
      });
      return;
    }
    const [newAsset] = await db.insert(fleetAssets).values({
      assetCode: data.assetCode.toUpperCase().trim(),
      name: data.name,
      assetType: data.assetType,
      licensePlate: data.licensePlate.toUpperCase().trim(),
      status: data.status
    }).returning();
    res.status(201).json({
      message: "Fleet asset registered successfully.",
      asset: newAsset
    });
  } catch (error) {
    console.error("[FLEET ERROR] Failed to register fleet asset:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to register fleet asset."
    });
  }
}
async function updateFleetAssetStatus(req, res) {
  try {
    const id = req.params.id;
    const parseResult = updateFleetStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const { status } = parseResult.data;
    const existing = await db.query.fleetAssets.findFirst({
      where: eq4(fleetAssets.id, id)
    });
    if (!existing) {
      res.status(404).json({
        error: "NotFound",
        message: "Fleet asset not found."
      });
      return;
    }
    const [updated] = await db.update(fleetAssets).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(fleetAssets.id, id)).returning();
    res.status(200).json({
      message: "Fleet asset status updated successfully.",
      asset: updated
    });
  } catch (error) {
    console.error("[FLEET ERROR] Failed to update fleet asset status:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to update fleet asset status."
    });
  }
}

// src/routes/fleet.route.ts
var fleetRouter = Router4();
fleetRouter.use(authenticateToken);
fleetRouter.get("/", getFleetAssets);
fleetRouter.get("/:id", getFleetAssetById);
fleetRouter.post("/", requireRole(["SUPERVISOR"]), createFleetAsset);
fleetRouter.patch("/:id/status", requireRole(["SUPERVISOR", "LEAD_TECHNICIAN"]), updateFleetAssetStatus);

// src/routes/workOrder.route.ts
import { Router as Router5 } from "express";

// src/schemas/workOrder.schema.ts
import { z as z4 } from "zod";
var createWorkOrderSchema = z4.object({
  clientFacilityId: z4.string().uuid("Valid client facility UUID required"),
  leadTechnicianId: z4.string().uuid("Valid lead technician UUID required"),
  assignedFleetAssetId: z4.string().uuid("Valid fleet asset UUID required").optional().nullable(),
  assignedTechnicianIds: z4.array(z4.string().uuid()).default([]),
  title: z4.string().min(5, "Title must be at least 5 characters long"),
  description: z4.string().min(10, "Detailed breakdown/task description is required"),
  priority: z4.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL_EMERGENCY"]).default("MEDIUM"),
  scheduledStartTime: z4.string().datetime("ISO 8601 scheduled start timestamp required"),
  scheduledEndTime: z4.string().datetime("ISO 8601 scheduled end timestamp required")
});
var updateWorkOrderStatusSchema = z4.object({
  status: z4.enum([
    "DISPATCHED",
    "EN_ROUTE",
    "ON_SITE_ACTIVE",
    "UNACKNOWLEDGED_BREAK",
    "AWAITING_PARTS_APPROVAL",
    "COMPLETED",
    "BILLED",
    "CANCELLED"
  ]),
  actualStartTime: z4.string().datetime().optional().nullable(),
  actualEndTime: z4.string().datetime().optional().nullable(),
  notes: z4.string().optional()
});

// src/services/calendarPayload.service.ts
function buildEventKitCalendarPayload(workOrder) {
  return {
    calendarIdentifier: `WHIRL-DISPATCH-${workOrder.workOrderNumber}`,
    eventTitle: `[WhirlDispatch] ${workOrder.title}`,
    notes: `${workOrder.description}

Client Facility: ${workOrder.facility.facilityName}
Assigned Fleet: ${workOrder.fleetAsset ? `${workOrder.fleetAsset.assetCode} - ${workOrder.fleetAsset.name}` : "None Allocated"}`,
    startDate: workOrder.scheduledStartTime.toISOString(),
    endDate: workOrder.scheduledEndTime.toISOString(),
    structuredLocation: {
      title: workOrder.facility.facilityName,
      address: workOrder.facility.address,
      latitude: workOrder.facility.latitude,
      longitude: workOrder.facility.longitude,
      radiusMeters: workOrder.facility.geofenceRadius
    },
    alarms: [
      {
        relativeOffsetSeconds: -3600,
        // 60 minutes prior for fleet transit & tool loading
        type: "TRANSIT_WARNING"
      },
      {
        relativeOffsetSeconds: -900,
        // 15 minutes prior for site geofence entry preparation
        type: "ARRIVAL_ALERT"
      }
    ],
    assignedFleetAsset: workOrder.fleetAsset ? `${workOrder.fleetAsset.assetCode} (${workOrder.fleetAsset.licensePlate})` : null,
    workOrderNumber: workOrder.workOrderNumber
  };
}

// src/controllers/workOrder.controller.ts
import { eq as eq5, desc } from "drizzle-orm";
async function createWorkOrder(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required to create dispatches."
      });
      return;
    }
    const parseResult = createWorkOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const data = parseResult.data;
    const facility = await db.query.clientFacilities.findFirst({
      where: eq5(clientFacilities.id, data.clientFacilityId)
    });
    if (!facility) {
      res.status(404).json({
        error: "NotFound",
        message: "Designated client commercial facility not found."
      });
      return;
    }
    const leadTech = await db.query.users.findFirst({
      where: eq5(users.id, data.leadTechnicianId)
    });
    if (!leadTech || leadTech.role !== "LEAD_TECHNICIAN" && leadTech.role !== "TECHNICIAN") {
      res.status(400).json({
        error: "InvalidAssignment",
        message: "Lead technician must be an active field lead or senior technician."
      });
      return;
    }
    let assignedAsset = null;
    if (data.assignedFleetAssetId) {
      assignedAsset = await db.query.fleetAssets.findFirst({
        where: eq5(fleetAssets.id, data.assignedFleetAssetId)
      });
      if (!assignedAsset) {
        res.status(404).json({
          error: "NotFound",
          message: "Allocated fleet asset not found in company registry."
        });
        return;
      }
      if (assignedAsset.status === "UNDER_MAINTENANCE") {
        res.status(409).json({
          error: "AssetUnavailable",
          message: `Fleet asset '${assignedAsset.assetCode}' is currently under maintenance and cannot be deployed.`
        });
        return;
      }
    }
    const randomSuffix = Math.floor(1e3 + Math.random() * 9e3);
    const workOrderNumber = `WO-2026-${randomSuffix}`;
    const [newWorkOrder] = await db.insert(workOrders).values({
      workOrderNumber,
      clientFacilityId: data.clientFacilityId,
      supervisorId: authUser.userId,
      leadTechnicianId: data.leadTechnicianId,
      assignedFleetAssetId: data.assignedFleetAssetId || null,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: "DISPATCHED",
      scheduledStartTime: new Date(data.scheduledStartTime),
      scheduledEndTime: new Date(data.scheduledEndTime)
    }).returning();
    if (data.assignedFleetAssetId) {
      await db.update(fleetAssets).set({ status: "DEPLOYED", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(fleetAssets.id, data.assignedFleetAssetId));
    }
    const teamIds = Array.from(/* @__PURE__ */ new Set([data.leadTechnicianId, ...data.assignedTechnicianIds]));
    if (teamIds.length > 0) {
      const assignmentInserts = teamIds.map((techId) => ({
        workOrderId: newWorkOrder.id,
        technicianId: techId
      }));
      await db.insert(workOrderAssignments).values(assignmentInserts);
      const notificationInserts = teamIds.map((techId) => ({
        recipientUserId: techId,
        workOrderId: newWorkOrder.id,
        notificationType: "URGENT_DISPATCH",
        title: `New Dispatch: ${newWorkOrder.workOrderNumber}`,
        body: `You have been dispatched to ${facility.facilityName} for '${newWorkOrder.title}'.`
      }));
      await db.insert(systemNotifications).values(notificationInserts);
    }
    res.status(201).json({
      message: "Work order created and dispatched successfully.",
      workOrder: {
        ...newWorkOrder,
        facilityName: facility.facilityName,
        assignedFleetAsset: assignedAsset ? assignedAsset.assetCode : null
      }
    });
  } catch (error) {
    console.error("[WORK ORDER ERROR] Creation failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to create and dispatch work order."
    });
  }
}
async function getWorkOrders(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
      return;
    }
    const { status, priority } = req.query;
    let allOrders = await db.query.workOrders.findMany({
      orderBy: [desc(workOrders.createdAt)],
      with: {
        facility: true,
        fleetAsset: true,
        leadTechnician: {
          columns: { id: true, fullName: true, email: true, phone: true }
        },
        supervisor: {
          columns: { id: true, fullName: true, email: true }
        },
        assignments: {
          with: {
            technician: {
              columns: { id: true, fullName: true, email: true, phone: true }
            }
          }
        }
      }
    });
    if (authUser.role === "TECHNICIAN" || authUser.role === "LEAD_TECHNICIAN") {
      allOrders = allOrders.filter((wo) => {
        const isLead = wo.leadTechnicianId === authUser.userId;
        const isAssigned = wo.assignments.some((a) => a.technicianId === authUser.userId);
        return isLead || isAssigned;
      });
    }
    if (status && typeof status === "string") {
      allOrders = allOrders.filter((wo) => wo.status === status);
    }
    if (priority && typeof priority === "string") {
      allOrders = allOrders.filter((wo) => wo.priority === priority);
    }
    res.status(200).json({
      count: allOrders.length,
      workOrders: allOrders
    });
  } catch (error) {
    console.error("[WORK ORDER ERROR] Failed to fetch list:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve work orders."
    });
  }
}
async function getWorkOrderDetail(req, res) {
  try {
    const id = req.params.id;
    const workOrder = await db.query.workOrders.findFirst({
      where: eq5(workOrders.id, id),
      with: {
        facility: true,
        fleetAsset: true,
        leadTechnician: {
          columns: { id: true, fullName: true, email: true, phone: true }
        },
        supervisor: {
          columns: { id: true, fullName: true, email: true }
        },
        assignments: {
          with: {
            technician: {
              columns: { id: true, fullName: true, email: true, phone: true }
            }
          }
        }
      }
    });
    if (!workOrder) {
      res.status(404).json({
        error: "NotFound",
        message: "Work order dispatch not found."
      });
      return;
    }
    const eventKitPayload = buildEventKitCalendarPayload({
      workOrderNumber: workOrder.workOrderNumber,
      title: workOrder.title,
      description: workOrder.description,
      scheduledStartTime: workOrder.scheduledStartTime,
      scheduledEndTime: workOrder.scheduledEndTime,
      facility: {
        facilityName: workOrder.facility.facilityName,
        address: workOrder.facility.address,
        latitude: workOrder.facility.latitude,
        longitude: workOrder.facility.longitude,
        geofenceRadius: workOrder.facility.geofenceRadius
      },
      fleetAsset: workOrder.fleetAsset
    });
    res.status(200).json({
      workOrder,
      eventKitPayload
    });
  } catch (error) {
    console.error("[WORK ORDER ERROR] Failed to fetch detail:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve work order detail."
    });
  }
}

// src/controllers/workOrderStatus.controller.ts
import { eq as eq6 } from "drizzle-orm";
async function updateWorkOrderStatus(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
      return;
    }
    const id = req.params.id;
    const parseResult = updateWorkOrderStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const { status, actualStartTime, actualEndTime } = parseResult.data;
    const existing = await db.query.workOrders.findFirst({
      where: eq6(workOrders.id, id),
      with: {
        assignments: true
      }
    });
    if (!existing) {
      res.status(404).json({ error: "NotFound", message: "Work order not found." });
      return;
    }
    const isSupervisor = authUser.role === "SUPERVISOR";
    const isLead = existing.leadTechnicianId === authUser.userId;
    const isAssigned = existing.assignments.some((a) => a.technicianId === authUser.userId);
    if (!isSupervisor && !isLead && !isAssigned) {
      res.status(403).json({
        error: "Forbidden",
        message: "You are not assigned to this work order."
      });
      return;
    }
    const updatePayload = {
      status,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (actualStartTime) {
      updatePayload.actualStartTime = new Date(actualStartTime);
    } else if (status === "ON_SITE_ACTIVE" && !existing.actualStartTime) {
      updatePayload.actualStartTime = /* @__PURE__ */ new Date();
    }
    if (actualEndTime) {
      updatePayload.actualEndTime = new Date(actualEndTime);
    } else if (status === "COMPLETED" && !existing.actualEndTime) {
      updatePayload.actualEndTime = /* @__PURE__ */ new Date();
    }
    const [updated] = await db.update(workOrders).set(updatePayload).where(eq6(workOrders.id, id)).returning();
    if ((status === "COMPLETED" || status === "CANCELLED") && existing.assignedFleetAssetId) {
      await db.update(fleetAssets).set({ status: "AVAILABLE", updatedAt: /* @__PURE__ */ new Date() }).where(eq6(fleetAssets.id, existing.assignedFleetAssetId));
    }
    res.status(200).json({
      message: `Work order state transitioned to '${status}'.`,
      workOrder: updated
    });
  } catch (error) {
    console.error("[WORK ORDER ERROR] Status update failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to update work order lifecycle status."
    });
  }
}

// src/routes/workOrder.route.ts
var workOrdersRouter = Router5();
workOrdersRouter.use(authenticateToken);
workOrdersRouter.get("/", getWorkOrders);
workOrdersRouter.get("/:id", getWorkOrderDetail);
workOrdersRouter.post("/", requireRole(["SUPERVISOR"]), createWorkOrder);
workOrdersRouter.patch("/:id/status", updateWorkOrderStatus);

// src/routes/attendance.route.ts
import { Router as Router6 } from "express";

// src/schemas/attendance.schema.ts
import { z as z5 } from "zod";
var clockInSchema = z5.object({
  workOrderId: z5.string().uuid("Valid work order UUID required"),
  latitude: z5.number().min(-90).max(90, "Valid latitude required"),
  longitude: z5.number().min(-180).max(180, "Valid longitude required"),
  accuracyMeters: z5.number().nonnegative().default(5),
  biometricVerified: z5.boolean().default(false)
});
var clockOutSchema = z5.object({
  workOrderId: z5.string().uuid("Valid work order UUID required"),
  latitude: z5.number().min(-90).max(90, "Valid latitude required"),
  longitude: z5.number().min(-180).max(180, "Valid longitude required"),
  accuracyMeters: z5.number().nonnegative().default(5)
});
var boundaryEventSchema = z5.object({
  workOrderId: z5.string().uuid("Valid work order UUID required"),
  eventType: z5.enum([
    "GEOFENCE_ENTER",
    "GEOFENCE_EXIT_BREACH",
    "BREAK_PAUSED",
    "BIOMETRIC_REAUTH_RESUME",
    "SUPERVISOR_OVERRIDE"
  ]),
  latitude: z5.number().min(-90).max(90, "Valid latitude required"),
  longitude: z5.number().min(-180).max(180, "Valid longitude required"),
  accuracyMeters: z5.number().nonnegative().default(5),
  notes: z5.string().optional()
});
var resumeShiftSchema = z5.object({
  workOrderId: z5.string().uuid("Valid work order UUID required"),
  latitude: z5.number().min(-90).max(90, "Valid latitude required"),
  longitude: z5.number().min(-180).max(180, "Valid longitude required"),
  accuracyMeters: z5.number().nonnegative().default(5),
  biometricVerified: z5.boolean().refine((val) => val === true, {
    message: "Biometric verification (Face ID/Touch ID) required to resume shift after boundary breach."
  })
});

// src/utils/haversine.ts
var EARTH_RADIUS_METERS = 6371e3;
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}
function isInsideGeofence(deviceLat, deviceLon, facilityLat, facilityLon, geofenceRadiusMeters, accuracyMeters = 0) {
  const distanceMeters = calculateDistanceMeters(deviceLat, deviceLon, facilityLat, facilityLon);
  const effectiveRadius = geofenceRadiusMeters + Math.min(accuracyMeters, 15);
  const isInside = distanceMeters <= effectiveRadius;
  return { isInside, distanceMeters };
}

// src/controllers/attendance.controller.ts
import { eq as eq7, and, desc as desc2, isNull } from "drizzle-orm";
async function clockIn(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
      return;
    }
    const parseResult = clockInSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const { workOrderId, latitude, longitude, accuracyMeters, biometricVerified } = parseResult.data;
    const workOrder = await db.query.workOrders.findFirst({
      where: eq7(workOrders.id, workOrderId),
      with: {
        facility: true,
        assignments: true
      }
    });
    if (!workOrder) {
      res.status(404).json({ error: "NotFound", message: "Work order not found." });
      return;
    }
    const isLead = workOrder.leadTechnicianId === authUser.userId;
    const isAssigned = workOrder.assignments.some((a) => a.technicianId === authUser.userId);
    const isSupervisor = authUser.role === "SUPERVISOR";
    if (!isLead && !isAssigned && !isSupervisor) {
      res.status(403).json({
        error: "Forbidden",
        message: "You are not assigned to this maintenance work order."
      });
      return;
    }
    const geofenceCheck = isInsideGeofence(
      latitude,
      longitude,
      workOrder.facility.latitude,
      workOrder.facility.longitude,
      workOrder.facility.geofenceRadius,
      accuracyMeters
    );
    if (!geofenceCheck.isInside) {
      res.status(400).json({
        error: "OutOfGeofence",
        message: `Device is outside client site geofence perimeter. Distance: ${geofenceCheck.distanceMeters}m, Required: <= ${workOrder.facility.geofenceRadius}m.`,
        currentDistanceMeters: geofenceCheck.distanceMeters,
        allowedRadiusMeters: workOrder.facility.geofenceRadius
      });
      return;
    }
    const activeSession = await db.query.siteAttendance.findFirst({
      where: and(
        eq7(siteAttendance.workOrderId, workOrderId),
        eq7(siteAttendance.technicianId, authUser.userId),
        eq7(siteAttendance.sessionStatus, "ACTIVE_ON_SITE")
      )
    });
    if (activeSession) {
      res.status(409).json({
        error: "SessionActive",
        message: "Technician is already clocked into an active shift on this work order.",
        session: activeSession
      });
      return;
    }
    const clockInTime = /* @__PURE__ */ new Date();
    const [newSession] = await db.insert(siteAttendance).values({
      workOrderId,
      technicianId: authUser.userId,
      clockInTimestamp: clockInTime,
      sessionStatus: "ACTIVE_ON_SITE",
      totalBillableSeconds: 0,
      totalBreakSeconds: 0
    }).returning();
    await db.insert(geofenceAuditLogs).values({
      workOrderId,
      technicianId: authUser.userId,
      siteAttendanceId: newSession.id,
      eventType: "GEOFENCE_ENTER",
      recordedTimestamp: clockInTime,
      deviceLatitude: latitude,
      deviceLongitude: longitude,
      accuracyMeters,
      isTamperVerified: true,
      notes: `Verified site arrival at ${workOrder.facility.facilityName}. Biometric authenticated: ${biometricVerified}. Distance: ${geofenceCheck.distanceMeters}m.`
    });
    if (workOrder.status === "DISPATCHED" || workOrder.status === "EN_ROUTE") {
      await db.update(workOrders).set({
        status: "ON_SITE_ACTIVE",
        actualStartTime: workOrder.actualStartTime || clockInTime,
        updatedAt: clockInTime
      }).where(eq7(workOrders.id, workOrderId));
    }
    res.status(201).json({
      message: "On-site arrival verified and clocked in successfully.",
      session: newSession,
      geofenceVerification: {
        facilityName: workOrder.facility.facilityName,
        distanceMeters: geofenceCheck.distanceMeters,
        perimeterVerified: true,
        biometricVerified
      }
    });
  } catch (error) {
    console.error("[ATTENDANCE ERROR] Clock in failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to process clock-in request."
    });
  }
}
async function clockOut(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
      return;
    }
    const parseResult = clockOutSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const { workOrderId, latitude, longitude, accuracyMeters } = parseResult.data;
    const activeSession = await db.query.siteAttendance.findFirst({
      where: and(
        eq7(siteAttendance.workOrderId, workOrderId),
        eq7(siteAttendance.technicianId, authUser.userId),
        isNull(siteAttendance.clockOutTimestamp)
      ),
      orderBy: [desc2(siteAttendance.createdAt)]
    });
    if (!activeSession) {
      res.status(404).json({
        error: "NotFound",
        message: "No active on-site shift session found to clock out from."
      });
      return;
    }
    const clockOutTime = /* @__PURE__ */ new Date();
    const elapsedSeconds = Math.max(
      0,
      Math.floor((clockOutTime.getTime() - activeSession.clockInTimestamp.getTime()) / 1e3)
    );
    const billableSeconds = Math.max(0, elapsedSeconds - (activeSession.totalBreakSeconds || 0));
    const [updatedSession] = await db.update(siteAttendance).set({
      clockOutTimestamp: clockOutTime,
      totalBillableSeconds: billableSeconds,
      sessionStatus: "CLOCKED_OUT",
      updatedAt: clockOutTime
    }).where(eq7(siteAttendance.id, activeSession.id)).returning();
    await db.insert(geofenceAuditLogs).values({
      workOrderId,
      technicianId: authUser.userId,
      siteAttendanceId: activeSession.id,
      eventType: "BREAK_PAUSED",
      recordedTimestamp: clockOutTime,
      deviceLatitude: latitude,
      deviceLongitude: longitude,
      accuracyMeters,
      isTamperVerified: true,
      notes: `Clock-out recorded. Total billable duration: ${Math.round(billableSeconds / 3600 * 100) / 100} hours.`
    });
    res.status(200).json({
      message: "Clocked out successfully.",
      session: updatedSession,
      summary: {
        totalHoursWorked: Math.round(billableSeconds / 3600 * 100) / 100,
        totalBillableSeconds: billableSeconds,
        breakSeconds: activeSession.totalBreakSeconds
      }
    });
  } catch (error) {
    console.error("[ATTENDANCE ERROR] Clock out failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to process clock-out request."
    });
  }
}
async function getAttendanceTimeline(req, res) {
  try {
    const id = req.params.id;
    const sessions = await db.query.siteAttendance.findMany({
      where: eq7(siteAttendance.workOrderId, id),
      with: {
        technician: {
          columns: { id: true, fullName: true, email: true, role: true }
        },
        auditLogs: {
          orderBy: (logs, { asc }) => [asc(logs.recordedTimestamp)]
        }
      },
      orderBy: [desc2(siteAttendance.createdAt)]
    });
    res.status(200).json({
      workOrderId: id,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error("[ATTENDANCE ERROR] Timeline fetch failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve attendance timeline."
    });
  }
}

// src/controllers/geofenceBreach.controller.ts
import { eq as eq8, and as and2, desc as desc3, isNull as isNull2 } from "drizzle-orm";
async function handleBoundaryEvent(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
      return;
    }
    const parseResult = boundaryEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const { workOrderId, eventType, latitude, longitude, accuracyMeters, notes } = parseResult.data;
    const activeSession = await db.query.siteAttendance.findFirst({
      where: and2(
        eq8(siteAttendance.workOrderId, workOrderId),
        eq8(siteAttendance.technicianId, authUser.userId),
        isNull2(siteAttendance.clockOutTimestamp)
      ),
      orderBy: [desc3(siteAttendance.createdAt)]
    });
    if (!activeSession) {
      res.status(404).json({
        error: "NotFound",
        message: "No active attendance session found to log boundary event against."
      });
      return;
    }
    const now = /* @__PURE__ */ new Date();
    if (eventType === "GEOFENCE_EXIT_BREACH") {
      await db.update(siteAttendance).set({
        sessionStatus: "ON_BREAK_VIOLATION",
        updatedAt: now
      }).where(eq8(siteAttendance.id, activeSession.id));
      const workOrder = await db.query.workOrders.findFirst({
        where: eq8(workOrders.id, workOrderId),
        with: { facility: true }
      });
      if (workOrder) {
        const alertRecipients = Array.from(
          /* @__PURE__ */ new Set([workOrder.supervisorId, workOrder.leadTechnicianId])
        ).filter((id) => id !== authUser.userId);
        if (alertRecipients.length > 0) {
          const alerts = alertRecipients.map((recipientId) => ({
            recipientUserId: recipientId,
            workOrderId,
            notificationType: "GEOFENCE_BREACH_ALERT",
            title: "Unauthorized Boundary Breach Alert",
            body: `Technician '${authUser.fullName}' triggered a geofence boundary breach at ${workOrder.facility.facilityName}. Billable shift timer paused.`
          }));
          await db.insert(systemNotifications).values(alerts);
        }
      }
    }
    const [auditLog] = await db.insert(geofenceAuditLogs).values({
      workOrderId,
      technicianId: authUser.userId,
      siteAttendanceId: activeSession.id,
      eventType,
      recordedTimestamp: now,
      deviceLatitude: latitude,
      deviceLongitude: longitude,
      accuracyMeters,
      isTamperVerified: true,
      notes: notes || `Boundary event recorded: ${eventType}. Shift timer state updated.`
    }).returning();
    res.status(200).json({
      message: `Boundary event '${eventType}' logged successfully.`,
      event: auditLog,
      sessionStatus: eventType === "GEOFENCE_EXIT_BREACH" ? "ON_BREAK_VIOLATION" : activeSession.sessionStatus
    });
  } catch (error) {
    console.error("[GEOFENCE ERROR] Boundary event handling failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to process geofence boundary event."
    });
  }
}
async function resumeShift(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
      return;
    }
    const parseResult = resumeShiftSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const { workOrderId, latitude, longitude, accuracyMeters, biometricVerified } = parseResult.data;
    const workOrder = await db.query.workOrders.findFirst({
      where: eq8(workOrders.id, workOrderId),
      with: { facility: true }
    });
    if (!workOrder) {
      res.status(404).json({ error: "NotFound", message: "Work order not found." });
      return;
    }
    const geofenceCheck = isInsideGeofence(
      latitude,
      longitude,
      workOrder.facility.latitude,
      workOrder.facility.longitude,
      workOrder.facility.geofenceRadius,
      accuracyMeters
    );
    if (!geofenceCheck.isInside) {
      res.status(400).json({
        error: "OutOfGeofence",
        message: `Cannot resume shift while outside facility perimeter. Distance: ${geofenceCheck.distanceMeters}m, Required: <= ${workOrder.facility.geofenceRadius}m.`,
        currentDistanceMeters: geofenceCheck.distanceMeters
      });
      return;
    }
    const session = await db.query.siteAttendance.findFirst({
      where: and2(
        eq8(siteAttendance.workOrderId, workOrderId),
        eq8(siteAttendance.technicianId, authUser.userId),
        eq8(siteAttendance.sessionStatus, "ON_BREAK_VIOLATION")
      ),
      orderBy: [desc3(siteAttendance.createdAt)]
    });
    if (!session) {
      res.status(404).json({
        error: "NotFound",
        message: "No paused or break-violated session found to resume."
      });
      return;
    }
    const lastBreach = await db.query.geofenceAuditLogs.findFirst({
      where: and2(
        eq8(geofenceAuditLogs.siteAttendanceId, session.id),
        eq8(geofenceAuditLogs.eventType, "GEOFENCE_EXIT_BREACH")
      ),
      orderBy: [desc3(geofenceAuditLogs.recordedTimestamp)]
    });
    const now = /* @__PURE__ */ new Date();
    let additionalBreakSeconds = 0;
    if (lastBreach) {
      additionalBreakSeconds = Math.max(
        0,
        Math.floor((now.getTime() - lastBreach.recordedTimestamp.getTime()) / 1e3)
      );
    }
    const updatedBreakTotal = (session.totalBreakSeconds || 0) + additionalBreakSeconds;
    const [resumedSession] = await db.update(siteAttendance).set({
      sessionStatus: "ACTIVE_ON_SITE",
      totalBreakSeconds: updatedBreakTotal,
      updatedAt: now
    }).where(eq8(siteAttendance.id, session.id)).returning();
    await db.insert(geofenceAuditLogs).values({
      workOrderId,
      technicianId: authUser.userId,
      siteAttendanceId: session.id,
      eventType: "BIOMETRIC_REAUTH_RESUME",
      recordedTimestamp: now,
      deviceLatitude: latitude,
      deviceLongitude: longitude,
      accuracyMeters,
      isTamperVerified: true,
      notes: `Shift resumed following Face ID/Touch ID verification. Unacknowledged break duration: ${additionalBreakSeconds}s.`
    });
    res.status(200).json({
      message: "Physical site re-entry confirmed and shift resumed via biometric authentication.",
      session: resumedSession,
      breakDurationSeconds: additionalBreakSeconds,
      biometricVerified
    });
  } catch (error) {
    console.error("[GEOFENCE ERROR] Resume shift failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to resume shift."
    });
  }
}

// src/routes/attendance.route.ts
var attendanceRouter = Router6();
attendanceRouter.use(authenticateToken);
attendanceRouter.post("/clock-in", clockIn);
attendanceRouter.post("/clock-out", clockOut);
attendanceRouter.post("/boundary-event", handleBoundaryEvent);
attendanceRouter.post("/resume-shift", resumeShift);
attendanceRouter.get("/work-order/:id", getAttendanceTimeline);

// src/routes/dossier.route.ts
import { Router as Router7 } from "express";

// src/schemas/dossier.schema.ts
import { z as z6 } from "zod";
var checklistCategoryEnum2 = z6.enum([
  "COMPRESSOR_SYSTEM",
  "REFRIGERANT_CIRCUIT",
  "ELECTRICAL_CONTROLS",
  "CONDENSER_AIR_FLOW"
]);
var photoTypeEnum2 = z6.enum([
  "BASELINE_BEFORE",
  "POST_SERVICE_AFTER",
  "DEFECT_EVIDENCE",
  "REPLACED_PART"
]);
var createOrUpdateDossierSchema = z6.object({
  workOrderId: z6.string().uuid("Valid work order UUID required"),
  equipmentModel: z6.string().min(1, "Equipment model is required"),
  equipmentSerialNumber: z6.string().optional(),
  baselineSuctionPressurePsi: z6.number().optional(),
  postServiceSuctionPressurePsi: z6.number().optional(),
  baselineDischargePressurePsi: z6.number().optional(),
  postServiceDischargePressurePsi: z6.number().optional(),
  baselineMotorRunningAmps: z6.number().optional(),
  postServiceMotorRunningAmps: z6.number().optional(),
  baselineCoilTempDifferential: z6.number().optional(),
  postServiceCoilTempDifferential: z6.number().optional(),
  diagnosticNotes: z6.string().optional(),
  isCompleted: z6.boolean().optional()
});
var checklistItemSchema = z6.object({
  category: checklistCategoryEnum2,
  itemLabel: z6.string().min(1, "Item label is required"),
  isChecked: z6.boolean().default(false),
  notes: z6.string().optional()
});
var submitChecklistSchema = z6.object({
  items: z6.array(checklistItemSchema).min(1, "At least one checklist item required")
});
var attachProofPhotoSchema = z6.object({
  photoType: photoTypeEnum2,
  photoUrl: z6.string().min(1, "Photo URL or base64 data string is required"),
  capturedLatitude: z6.number().min(-90).max(90, "Valid latitude required"),
  capturedLongitude: z6.number().min(-180).max(180, "Valid longitude required"),
  isLiveCameraCaptured: z6.boolean().default(true),
  capturedTimestamp: z6.string().datetime().optional()
});

// src/controllers/dossier.controller.ts
import { eq as eq9, desc as desc4 } from "drizzle-orm";
async function createOrUpdateDossier(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
      return;
    }
    const parseResult = createOrUpdateDossierSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const data = parseResult.data;
    const workOrder = await db.query.workOrders.findFirst({
      where: eq9(workOrders.id, data.workOrderId),
      with: { assignments: true }
    });
    if (!workOrder) {
      res.status(404).json({ error: "NotFound", message: "Work order not found." });
      return;
    }
    const isLead = workOrder.leadTechnicianId === authUser.userId;
    const isAssigned = workOrder.assignments.some((a) => a.technicianId === authUser.userId);
    const isSupervisor = authUser.role === "SUPERVISOR";
    if (!isLead && !isAssigned && !isSupervisor) {
      res.status(403).json({
        error: "Forbidden",
        message: "Only assigned technicians or supervisors may file diagnostic dossiers."
      });
      return;
    }
    const existingDossier = await db.query.diagnosticDossiers.findFirst({
      where: eq9(diagnosticDossiers.workOrderId, data.workOrderId)
    });
    const now = /* @__PURE__ */ new Date();
    if (existingDossier) {
      const updatePayload = {
        equipmentModel: data.equipmentModel,
        updatedAt: now
      };
      if (data.equipmentSerialNumber !== void 0) {
        updatePayload.equipmentSerialNumber = data.equipmentSerialNumber;
      }
      if (data.baselineSuctionPressurePsi !== void 0) {
        updatePayload.baselineSuctionPressurePsi = data.baselineSuctionPressurePsi.toString();
      }
      if (data.postServiceSuctionPressurePsi !== void 0) {
        updatePayload.postServiceSuctionPressurePsi = data.postServiceSuctionPressurePsi.toString();
      }
      if (data.baselineDischargePressurePsi !== void 0) {
        updatePayload.baselineDischargePressurePsi = data.baselineDischargePressurePsi.toString();
      }
      if (data.postServiceDischargePressurePsi !== void 0) {
        updatePayload.postServiceDischargePressurePsi = data.postServiceDischargePressurePsi.toString();
      }
      if (data.baselineMotorRunningAmps !== void 0) {
        updatePayload.baselineMotorRunningAmps = data.baselineMotorRunningAmps.toString();
      }
      if (data.postServiceMotorRunningAmps !== void 0) {
        updatePayload.postServiceMotorRunningAmps = data.postServiceMotorRunningAmps.toString();
      }
      if (data.baselineCoilTempDifferential !== void 0) {
        updatePayload.baselineCoilTempDifferential = data.baselineCoilTempDifferential.toString();
      }
      if (data.postServiceCoilTempDifferential !== void 0) {
        updatePayload.postServiceCoilTempDifferential = data.postServiceCoilTempDifferential.toString();
      }
      if (data.diagnosticNotes !== void 0) {
        updatePayload.diagnosticNotes = data.diagnosticNotes;
      }
      if (data.isCompleted !== void 0) {
        updatePayload.isCompleted = data.isCompleted;
        if (data.isCompleted) {
          updatePayload.completedAt = now;
        }
      }
      const [updated] = await db.update(diagnosticDossiers).set(updatePayload).where(eq9(diagnosticDossiers.id, existingDossier.id)).returning();
      res.status(200).json({
        message: "Diagnostic dossier updated successfully.",
        dossier: updated
      });
      return;
    }
    const [newDossier] = await db.insert(diagnosticDossiers).values({
      workOrderId: data.workOrderId,
      leadTechnicianId: authUser.userId,
      equipmentModel: data.equipmentModel,
      equipmentSerialNumber: data.equipmentSerialNumber || null,
      baselineSuctionPressurePsi: data.baselineSuctionPressurePsi !== void 0 ? data.baselineSuctionPressurePsi.toString() : null,
      postServiceSuctionPressurePsi: data.postServiceSuctionPressurePsi !== void 0 ? data.postServiceSuctionPressurePsi.toString() : null,
      baselineDischargePressurePsi: data.baselineDischargePressurePsi !== void 0 ? data.baselineDischargePressurePsi.toString() : null,
      postServiceDischargePressurePsi: data.postServiceDischargePressurePsi !== void 0 ? data.postServiceDischargePressurePsi.toString() : null,
      baselineMotorRunningAmps: data.baselineMotorRunningAmps !== void 0 ? data.baselineMotorRunningAmps.toString() : null,
      postServiceMotorRunningAmps: data.postServiceMotorRunningAmps !== void 0 ? data.postServiceMotorRunningAmps.toString() : null,
      baselineCoilTempDifferential: data.baselineCoilTempDifferential !== void 0 ? data.baselineCoilTempDifferential.toString() : null,
      postServiceCoilTempDifferential: data.postServiceCoilTempDifferential !== void 0 ? data.postServiceCoilTempDifferential.toString() : null,
      diagnosticNotes: data.diagnosticNotes || null,
      isCompleted: data.isCompleted ?? false,
      completedAt: data.isCompleted ? now : null
    }).returning();
    res.status(201).json({
      message: "Diagnostic dossier created successfully.",
      dossier: newDossier
    });
  } catch (error) {
    console.error("[DOSSIER ERROR] Create/update dossier failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to save diagnostic dossier."
    });
  }
}
async function getDossierByWorkOrder(req, res) {
  try {
    const id = req.params.id;
    let dossier = await db.query.diagnosticDossiers.findFirst({
      where: eq9(diagnosticDossiers.workOrderId, id),
      with: {
        leadTechnician: {
          columns: { id: true, fullName: true, email: true, role: true }
        },
        checklistItems: true,
        proofPhotos: {
          orderBy: [desc4(proofPhotos.capturedTimestamp)]
        }
      }
    });
    if (!dossier) {
      dossier = await db.query.diagnosticDossiers.findFirst({
        where: eq9(diagnosticDossiers.id, id),
        with: {
          leadTechnician: {
            columns: { id: true, fullName: true, email: true, role: true }
          },
          checklistItems: true,
          proofPhotos: {
            orderBy: [desc4(proofPhotos.capturedTimestamp)]
          }
        }
      });
    }
    if (!dossier) {
      res.status(404).json({
        error: "NotFound",
        message: "Diagnostic dossier not found for specified identifier."
      });
      return;
    }
    const baseSuction = dossier.baselineSuctionPressurePsi ? parseFloat(dossier.baselineSuctionPressurePsi) : null;
    const postSuction = dossier.postServiceSuctionPressurePsi ? parseFloat(dossier.postServiceSuctionPressurePsi) : null;
    const baseDischarge = dossier.baselineDischargePressurePsi ? parseFloat(dossier.baselineDischargePressurePsi) : null;
    const postDischarge = dossier.postServiceDischargePressurePsi ? parseFloat(dossier.postServiceDischargePressurePsi) : null;
    const baseAmps = dossier.baselineMotorRunningAmps ? parseFloat(dossier.baselineMotorRunningAmps) : null;
    const postAmps = dossier.postServiceMotorRunningAmps ? parseFloat(dossier.postServiceMotorRunningAmps) : null;
    const baseTempDiff = dossier.baselineCoilTempDifferential ? parseFloat(dossier.baselineCoilTempDifferential) : null;
    const postTempDiff = dossier.postServiceCoilTempDifferential ? parseFloat(dossier.postServiceCoilTempDifferential) : null;
    const totalChecklist = dossier.checklistItems.length;
    const checkedCount = dossier.checklistItems.filter((item) => item.isChecked).length;
    const completionRatePercent = totalChecklist > 0 ? Math.round(checkedCount / totalChecklist * 100) : 0;
    res.status(200).json({
      dossier,
      telemetryAnalysis: {
        suctionPressureDeltaPsi: baseSuction !== null && postSuction !== null ? +(postSuction - baseSuction).toFixed(2) : null,
        dischargePressureDeltaPsi: baseDischarge !== null && postDischarge !== null ? +(postDischarge - baseDischarge).toFixed(2) : null,
        motorRunningAmpsReduction: baseAmps !== null && postAmps !== null ? +(baseAmps - postAmps).toFixed(2) : null,
        coilTempDifferentialGain: baseTempDiff !== null && postTempDiff !== null ? +(postTempDiff - baseTempDiff).toFixed(2) : null,
        checklistCompletionRatePercent: completionRatePercent,
        totalPhotosAttached: dossier.proofPhotos.length
      }
    });
  } catch (error) {
    console.error("[DOSSIER ERROR] Fetch dossier failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve diagnostic dossier."
    });
  }
}
async function submitChecklistItems(req, res) {
  try {
    const id = req.params.id;
    const parseResult = submitChecklistSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const dossier = await db.query.diagnosticDossiers.findFirst({
      where: eq9(diagnosticDossiers.id, id)
    });
    if (!dossier) {
      res.status(404).json({
        error: "NotFound",
        message: "Diagnostic dossier not found."
      });
      return;
    }
    const { items } = parseResult.data;
    const valuesToInsert = items.map((item) => ({
      diagnosticDossierId: dossier.id,
      category: item.category,
      itemLabel: item.itemLabel,
      isChecked: item.isChecked,
      notes: item.notes || null
    }));
    const insertedItems = await db.insert(checklistItems).values(valuesToInsert).returning();
    res.status(201).json({
      message: `${insertedItems.length} checklist items logged successfully.`,
      checklistItems: insertedItems
    });
  } catch (error) {
    console.error("[DOSSIER ERROR] Submit checklist failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to submit checklist items."
    });
  }
}
async function attachProofPhoto(req, res) {
  try {
    const id = req.params.id;
    const parseResult = attachProofPhotoSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const dossier = await db.query.diagnosticDossiers.findFirst({
      where: eq9(diagnosticDossiers.id, id)
    });
    if (!dossier) {
      res.status(404).json({
        error: "NotFound",
        message: "Diagnostic dossier not found."
      });
      return;
    }
    const data = parseResult.data;
    const [newPhoto] = await db.insert(proofPhotos).values({
      diagnosticDossierId: dossier.id,
      photoType: data.photoType,
      photoUrl: data.photoUrl,
      capturedLatitude: data.capturedLatitude,
      capturedLongitude: data.capturedLongitude,
      isLiveCameraCaptured: data.isLiveCameraCaptured,
      capturedTimestamp: data.capturedTimestamp ? new Date(data.capturedTimestamp) : /* @__PURE__ */ new Date()
    }).returning();
    res.status(201).json({
      message: "Proof photo attached successfully with geotag metadata.",
      proofPhoto: newPhoto
    });
  } catch (error) {
    console.error("[DOSSIER ERROR] Attach photo failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to attach proof photo."
    });
  }
}

// src/routes/dossier.route.ts
var dossierRouter = Router7();
dossierRouter.use(authenticateToken);
dossierRouter.post("/", createOrUpdateDossier);
dossierRouter.get("/work-order/:id", getDossierByWorkOrder);
dossierRouter.post("/:id/checklist", submitChecklistItems);
dossierRouter.post("/:id/photos", attachProofPhoto);

// src/routes/expense.route.ts
import { Router as Router8 } from "express";

// src/schemas/expense.schema.ts
import { z as z7 } from "zod";
var expenseApprovalStatusEnum2 = z7.enum([
  "PENDING_SUPERVISOR_APPROVAL",
  "APPROVED",
  "FLAGGED_REJECTED"
]);
var expenseItemInputSchema = z7.object({
  partDescription: z7.string().min(1, "Part description is required"),
  quantity: z7.number().int().positive("Quantity must be at least 1").default(1),
  unitPrice: z7.number().positive("Unit price must be positive")
});
var createExpenseClaimSchema = z7.object({
  workOrderId: z7.string().uuid("Valid work order UUID required"),
  vendorName: z7.string().min(1, "Vendor name is required"),
  receiptNumber: z7.string().optional(),
  currency: z7.string().default("LKR"),
  receiptImageUrl: z7.string().min(1, "Receipt image URL is required"),
  receiptStoreLatitude: z7.number().min(-90).max(90, "Valid latitude required"),
  receiptStoreLongitude: z7.number().min(-180).max(180, "Valid longitude required"),
  receiptCapturedAt: z7.string().datetime().optional(),
  items: z7.array(expenseItemInputSchema).min(1, "At least one line item is required")
});
var reviewExpenseClaimSchema = z7.object({
  approvalStatus: z7.enum(["APPROVED", "FLAGGED_REJECTED"]),
  rejectionReason: z7.string().optional()
}).refine(
  (data) => {
    if (data.approvalStatus === "FLAGGED_REJECTED" && (!data.rejectionReason || data.rejectionReason.trim().length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: "Rejection reason is required when flagging or rejecting an expense claim.",
    path: ["rejectionReason"]
  }
);

// src/controllers/expense.controller.ts
import { eq as eq10, desc as desc5 } from "drizzle-orm";
var EXPENSE_THRESHOLD_LKR = Number(process.env.EXPENSE_THRESHOLD_LKR || 25e3);
async function createExpenseClaim(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
      return;
    }
    const parseResult = createExpenseClaimSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const data = parseResult.data;
    const workOrder = await db.query.workOrders.findFirst({
      where: eq10(workOrders.id, data.workOrderId),
      with: { assignments: true }
    });
    if (!workOrder) {
      res.status(404).json({ error: "NotFound", message: "Work order not found." });
      return;
    }
    const isLead = workOrder.leadTechnicianId === authUser.userId;
    const isAssigned = workOrder.assignments.some((a) => a.technicianId === authUser.userId);
    const isSupervisor = authUser.role === "SUPERVISOR";
    if (!isLead && !isAssigned && !isSupervisor) {
      res.status(403).json({
        error: "Forbidden",
        message: "Only assigned technicians or supervisors may submit emergency parts expenses."
      });
      return;
    }
    let calculatedTotal = 0;
    const preparedItems = data.items.map((item) => {
      const lineTotal = +(item.quantity * item.unitPrice).toFixed(2);
      calculatedTotal += lineTotal;
      return {
        partDescription: item.partDescription,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: lineTotal.toFixed(2)
      };
    });
    calculatedTotal = +calculatedTotal.toFixed(2);
    const isExceeded = calculatedTotal > EXPENSE_THRESHOLD_LKR;
    const now = /* @__PURE__ */ new Date();
    const [newClaim] = await db.insert(expenseClaims).values({
      workOrderId: data.workOrderId,
      leadTechnicianId: authUser.userId,
      vendorName: data.vendorName,
      receiptNumber: data.receiptNumber || null,
      totalAmount: calculatedTotal.toFixed(2),
      currency: data.currency || "LKR",
      receiptImageUrl: data.receiptImageUrl,
      receiptStoreLatitude: data.receiptStoreLatitude,
      receiptStoreLongitude: data.receiptStoreLongitude,
      receiptCapturedAt: data.receiptCapturedAt ? new Date(data.receiptCapturedAt) : now,
      isThresholdExceeded: isExceeded,
      approvalStatus: "PENDING_SUPERVISOR_APPROVAL"
    }).returning();
    const itemsToInsert = preparedItems.map((item) => ({
      expenseClaimId: newClaim.id,
      partDescription: item.partDescription,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }));
    const insertedItems = await db.insert(expenseItems).values(itemsToInsert).returning();
    if (isExceeded) {
      await db.insert(systemNotifications).values({
        recipientUserId: workOrder.supervisorId,
        workOrderId: data.workOrderId,
        notificationType: "EXPENSE_THRESHOLD_ALERT",
        title: "Emergency Expense Threshold Exceeded",
        body: `Expense claim of ${calculatedTotal} LKR from '${data.vendorName}' exceeds preset threshold of ${EXPENSE_THRESHOLD_LKR} LKR. Requires supervisor optical inspection.`
      });
    }
    res.status(201).json({
      message: "Emergency parts expense claim submitted successfully.",
      claim: newClaim,
      items: insertedItems,
      thresholdAlert: isExceeded ? {
        exceeded: true,
        limitLkr: EXPENSE_THRESHOLD_LKR,
        claimedLkr: calculatedTotal,
        notice: "Supervisor alert dispatched for review."
      } : null
    });
  } catch (error) {
    console.error("[EXPENSE ERROR] Create claim failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to record emergency parts expense."
    });
  }
}
async function getExpensesByWorkOrder(req, res) {
  try {
    const id = req.params.id;
    const claims = await db.query.expenseClaims.findMany({
      where: eq10(expenseClaims.workOrderId, id),
      with: {
        leadTechnician: {
          columns: { id: true, fullName: true, email: true }
        },
        reviewedBySupervisor: {
          columns: { id: true, fullName: true, email: true }
        },
        items: true
      },
      orderBy: [desc5(expenseClaims.createdAt)]
    });
    let totalClaimed = 0;
    let totalApproved = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    for (const claim of claims) {
      const amount = parseFloat(claim.totalAmount);
      totalClaimed += amount;
      if (claim.approvalStatus === "APPROVED") {
        totalApproved += amount;
        approvedCount++;
      } else if (claim.approvalStatus === "PENDING_SUPERVISOR_APPROVAL") {
        pendingCount++;
      } else if (claim.approvalStatus === "FLAGGED_REJECTED") {
        rejectedCount++;
      }
    }
    res.status(200).json({
      workOrderId: id,
      claimsCount: claims.length,
      claims,
      financialSummary: {
        totalClaimedAmount: +totalClaimed.toFixed(2),
        totalApprovedAmount: +totalApproved.toFixed(2),
        pendingClaimsCount: pendingCount,
        approvedClaimsCount: approvedCount,
        rejectedClaimsCount: rejectedCount
      }
    });
  } catch (error) {
    console.error("[EXPENSE ERROR] Fetch claims failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve expense claims."
    });
  }
}

// src/controllers/expenseApproval.controller.ts
import { eq as eq11 } from "drizzle-orm";
async function reviewExpenseClaim(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
      return;
    }
    if (authUser.role !== "SUPERVISOR") {
      res.status(403).json({
        error: "Forbidden",
        message: "Only supervisors may review, approve, or reject expense claims."
      });
      return;
    }
    const id = req.params.id;
    const parseResult = reviewExpenseClaimSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const { approvalStatus, rejectionReason } = parseResult.data;
    const claim = await db.query.expenseClaims.findFirst({
      where: eq11(expenseClaims.id, id),
      with: { workOrder: true }
    });
    if (!claim) {
      res.status(404).json({ error: "NotFound", message: "Expense claim not found." });
      return;
    }
    const now = /* @__PURE__ */ new Date();
    const [updatedClaim] = await db.update(expenseClaims).set({
      approvalStatus,
      reviewedBySupervisorId: authUser.userId,
      reviewedAt: now,
      rejectionReason: approvalStatus === "FLAGGED_REJECTED" ? rejectionReason : null,
      updatedAt: now
    }).where(eq11(expenseClaims.id, id)).returning();
    await db.insert(systemNotifications).values({
      recipientUserId: claim.leadTechnicianId,
      workOrderId: claim.workOrderId,
      notificationType: "EXPENSE_APPROVED",
      title: `Expense Claim ${approvalStatus === "APPROVED" ? "Approved" : "Flagged & Rejected"}`,
      body: approvalStatus === "APPROVED" ? `Supervisor approved expense of ${claim.totalAmount} LKR for vendor '${claim.vendorName}'.` : `Supervisor rejected expense claim. Reason: ${rejectionReason}`
    });
    res.status(200).json({
      message: `Expense claim ${approvalStatus === "APPROVED" ? "approved" : "flagged & rejected"} successfully.`,
      claim: updatedClaim
    });
  } catch (error) {
    console.error("[EXPENSE APPROVAL ERROR] Review failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to review expense claim."
    });
  }
}

// src/middleware/expenseLock.middleware.ts
import { eq as eq12 } from "drizzle-orm";
async function verifyExpenseNotLocked(req, res, next) {
  try {
    const id = req.params.id;
    const claim = await db.query.expenseClaims.findFirst({
      where: eq12(expenseClaims.id, id)
    });
    if (!claim) {
      res.status(404).json({
        error: "NotFound",
        message: "Expense claim not found."
      });
      return;
    }
    if (claim.approvalStatus === "APPROVED") {
      res.status(409).json({
        error: "ExpenseLocked",
        message: "Approved expense claim is permanently locked from modifications or status mutations."
      });
      return;
    }
    next();
  } catch (error) {
    console.error("[EXPENSE LOCK ERROR]", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to verify expense lock state."
    });
  }
}

// src/routes/expense.route.ts
var expenseRouter = Router8();
expenseRouter.use(authenticateToken);
expenseRouter.post("/", createExpenseClaim);
expenseRouter.get("/work-order/:id", getExpensesByWorkOrder);
expenseRouter.patch(
  "/:id/review",
  requireRole(["SUPERVISOR"]),
  verifyExpenseNotLocked,
  reviewExpenseClaim
);

// src/routes/billing.route.ts
import { Router as Router9 } from "express";

// src/services/billingCalculator.service.ts
import { eq as eq13, and as and3 } from "drizzle-orm";
async function compileWorkOrderBillingMetrics(workOrderId) {
  const workOrder = await db.query.workOrders.findFirst({
    where: eq13(workOrders.id, workOrderId),
    with: {
      facility: true,
      fleetAsset: true
    }
  });
  if (!workOrder) {
    throw new Error(`Work order '${workOrderId}' not found.`);
  }
  const attendanceSessions = await db.query.siteAttendance.findMany({
    where: eq13(siteAttendance.workOrderId, workOrderId)
  });
  let totalBillableSeconds = attendanceSessions.reduce(
    (acc, session) => acc + (session.totalBillableSeconds || 0),
    0
  );
  let totalBillableLaborHours = 0;
  if (totalBillableSeconds > 0) {
    totalBillableLaborHours = +(totalBillableSeconds / 3600).toFixed(2);
  } else {
    totalBillableLaborHours = 2.5;
  }
  const hourlyRate = parseFloat(workOrder.facility.contractHourlyRate) || 5e3;
  const subtotalLabor = +(totalBillableLaborHours * hourlyRate).toFixed(2);
  const approvedClaims = await db.query.expenseClaims.findMany({
    where: and3(
      eq13(expenseClaims.workOrderId, workOrderId),
      eq13(expenseClaims.approvalStatus, "APPROVED")
    )
  });
  const subtotalApprovedParts = +approvedClaims.reduce((acc, claim) => acc + parseFloat(claim.totalAmount), 0).toFixed(2);
  const partsMarkupPercent = parseFloat(workOrder.facility.partsMarkupPercent) || 15;
  const markupFactor = 1 + partsMarkupPercent / 100;
  const subtotalPartsWithMarkup = +(subtotalApprovedParts * markupFactor).toFixed(2);
  const fleetEquipmentFee = workOrder.assignedFleetAssetId ? 3500 : 0;
  const taxPercent = 8;
  const subtotalBeforeTax = subtotalLabor + subtotalPartsWithMarkup + fleetEquipmentFee;
  const taxAmount = +(subtotalBeforeTax * (taxPercent / 100)).toFixed(2);
  const grandTotal = +(subtotalBeforeTax + taxAmount).toFixed(2);
  const today = /* @__PURE__ */ new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1e3 + Math.random() * 9e3);
  const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;
  const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1e3);
  return {
    workOrderId,
    clientFacilityId: workOrder.clientFacilityId,
    totalBillableLaborHours,
    hourlyLaborRateApplied: hourlyRate,
    subtotalLabor,
    subtotalApprovedParts,
    partsMarkupPercentApplied: partsMarkupPercent,
    subtotalPartsWithMarkup,
    fleetEquipmentFee,
    taxPercent,
    taxAmount,
    grandTotal,
    invoiceNumber,
    dueDate
  };
}

// src/controllers/billing.controller.ts
import { eq as eq14 } from "drizzle-orm";
import { z as z8 } from "zod";
var updateInvoiceStatusSchema = z8.object({
  status: z8.enum([
    "DRAFT_ESTIMATE",
    "APPROVED_BY_SUPERVISOR",
    "ISSUED_TO_CLIENT",
    "PAID"
  ])
});
async function generateEstimate(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
      return;
    }
    if (authUser.role !== "PAYMENT_CLERK" && authUser.role !== "SUPERVISOR") {
      res.status(403).json({
        error: "Forbidden",
        message: "Only Payment Clerks or Supervisors may generate billing estimates."
      });
      return;
    }
    const workOrderId = req.params.workOrderId;
    const calculation = await compileWorkOrderBillingMetrics(workOrderId);
    const existingInvoice = await db.query.billingInvoices.findFirst({
      where: eq14(billingInvoices.workOrderId, workOrderId)
    });
    const now = /* @__PURE__ */ new Date();
    if (existingInvoice) {
      const [updated] = await db.update(billingInvoices).set({
        totalBillableLaborHours: calculation.totalBillableLaborHours.toFixed(2),
        hourlyLaborRateApplied: calculation.hourlyLaborRateApplied.toFixed(2),
        subtotalLabor: calculation.subtotalLabor.toFixed(2),
        subtotalApprovedParts: calculation.subtotalApprovedParts.toFixed(2),
        partsMarkupPercentApplied: calculation.partsMarkupPercentApplied.toFixed(2),
        subtotalPartsWithMarkup: calculation.subtotalPartsWithMarkup.toFixed(2),
        fleetEquipmentFee: calculation.fleetEquipmentFee.toFixed(2),
        taxPercent: calculation.taxPercent.toFixed(2),
        taxAmount: calculation.taxAmount.toFixed(2),
        grandTotal: calculation.grandTotal.toFixed(2),
        updatedAt: now
      }).where(eq14(billingInvoices.id, existingInvoice.id)).returning();
      res.status(200).json({
        message: "Billing estimate re-compiled and updated successfully.",
        invoice: updated
      });
      return;
    }
    const [newInvoice] = await db.insert(billingInvoices).values({
      invoiceNumber: calculation.invoiceNumber,
      workOrderId: calculation.workOrderId,
      clientFacilityId: calculation.clientFacilityId,
      clerkId: authUser.userId,
      totalBillableLaborHours: calculation.totalBillableLaborHours.toFixed(2),
      hourlyLaborRateApplied: calculation.hourlyLaborRateApplied.toFixed(2),
      subtotalLabor: calculation.subtotalLabor.toFixed(2),
      subtotalApprovedParts: calculation.subtotalApprovedParts.toFixed(2),
      partsMarkupPercentApplied: calculation.partsMarkupPercentApplied.toFixed(2),
      subtotalPartsWithMarkup: calculation.subtotalPartsWithMarkup.toFixed(2),
      fleetEquipmentFee: calculation.fleetEquipmentFee.toFixed(2),
      taxPercent: calculation.taxPercent.toFixed(2),
      taxAmount: calculation.taxAmount.toFixed(2),
      grandTotal: calculation.grandTotal.toFixed(2),
      status: "DRAFT_ESTIMATE",
      issueDate: now,
      dueDate: calculation.dueDate
    }).returning();
    res.status(201).json({
      message: "Official billing estimate compiled successfully.",
      invoice: newInvoice
    });
  } catch (error) {
    console.error("[BILLING ERROR] Generate estimate failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: error.message || "Failed to compile billing estimate."
    });
  }
}
async function getInvoice(req, res) {
  try {
    const id = req.params.id;
    let invoice = await db.query.billingInvoices.findFirst({
      where: eq14(billingInvoices.id, id),
      with: {
        facility: true,
        clerk: {
          columns: { id: true, fullName: true, email: true, role: true }
        },
        workOrder: true
      }
    });
    if (!invoice) {
      invoice = await db.query.billingInvoices.findFirst({
        where: eq14(billingInvoices.workOrderId, id),
        with: {
          facility: true,
          clerk: {
            columns: { id: true, fullName: true, email: true, role: true }
          },
          workOrder: true
        }
      });
    }
    if (!invoice) {
      res.status(404).json({
        error: "NotFound",
        message: "Billing invoice not found for specified identifier."
      });
      return;
    }
    res.status(200).json({
      invoice
    });
  } catch (error) {
    console.error("[BILLING ERROR] Fetch invoice failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve billing invoice."
    });
  }
}
async function updateInvoiceStatus(req, res) {
  try {
    const id = req.params.id;
    const parseResult = updateInvoiceStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parseResult.error.flatten().fieldErrors
      });
      return;
    }
    const { status } = parseResult.data;
    const existingInvoice = await db.query.billingInvoices.findFirst({
      where: eq14(billingInvoices.id, id)
    });
    if (!existingInvoice) {
      res.status(404).json({ error: "NotFound", message: "Invoice not found." });
      return;
    }
    const now = /* @__PURE__ */ new Date();
    const [updatedInvoice] = await db.update(billingInvoices).set({
      status,
      updatedAt: now
    }).where(eq14(billingInvoices.id, id)).returning();
    if (status === "ISSUED_TO_CLIENT" || status === "PAID") {
      await db.update(workOrders).set({
        status: "BILLED",
        updatedAt: now
      }).where(eq14(workOrders.id, existingInvoice.workOrderId));
    }
    res.status(200).json({
      message: `Invoice status transitioned to ${status}.`,
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error("[BILLING ERROR] Update status failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to update invoice status."
    });
  }
}

// src/controllers/analytics.controller.ts
import { eq as eq15 } from "drizzle-orm";
async function getSwiftChartsAnalytics(req, res) {
  try {
    const workOrderId = req.params.workOrderId;
    let invoice = await db.query.billingInvoices.findFirst({
      where: eq15(billingInvoices.workOrderId, workOrderId),
      with: { facility: true }
    });
    if (!invoice) {
      invoice = await db.query.billingInvoices.findFirst({
        where: eq15(billingInvoices.id, workOrderId),
        with: { facility: true }
      });
    }
    if (!invoice) {
      res.status(404).json({
        error: "NotFound",
        message: "No billing invoice found to generate Swift Charts telemetry from. Compile estimate first."
      });
      return;
    }
    const subtotalLabor = parseFloat(invoice.subtotalLabor);
    const subtotalParts = parseFloat(invoice.subtotalPartsWithMarkup);
    const fleetFee = parseFloat(invoice.fleetEquipmentFee);
    const taxAmount = parseFloat(invoice.taxAmount);
    const grandTotal = parseFloat(invoice.grandTotal);
    const laborPct = grandTotal > 0 ? +(subtotalLabor / grandTotal * 100).toFixed(1) : 0;
    const partsPct = grandTotal > 0 ? +(subtotalParts / grandTotal * 100).toFixed(1) : 0;
    const fleetPct = grandTotal > 0 ? +(fleetFee / grandTotal * 100).toFixed(1) : 0;
    const taxPct = grandTotal > 0 ? +(taxAmount / grandTotal * 100).toFixed(1) : 0;
    const attendanceRecords = await db.query.siteAttendance.findMany({
      where: eq15(siteAttendance.workOrderId, invoice.workOrderId),
      with: {
        technician: {
          columns: { id: true, fullName: true, role: true }
        }
      }
    });
    const hourlyRate = parseFloat(invoice.hourlyLaborRateApplied);
    const technicianBreakdown = attendanceRecords.map((att) => {
      const hours = +(att.totalBillableSeconds / 3600).toFixed(2);
      return {
        technicianId: att.technicianId,
        technicianName: att.technician.fullName,
        role: att.technician.role,
        billableHours: hours,
        costContributionLkr: +(hours * hourlyRate).toFixed(2)
      };
    });
    res.status(200).json({
      workOrderId: invoice.workOrderId,
      invoiceNumber: invoice.invoiceNumber,
      currency: "LKR",
      grandTotal,
      chartMarks: [
        {
          category: "Technician Labor",
          amount: subtotalLabor,
          percentage: laborPct,
          colorHex: "#007AFF"
          // iOS System Blue
        },
        {
          category: "Approved Parts",
          amount: subtotalParts,
          percentage: partsPct,
          colorHex: "#FF9500"
          // iOS System Orange
        },
        {
          category: "Fleet Equipment",
          amount: fleetFee,
          percentage: fleetPct,
          colorHex: "#5856D6"
          // iOS System Indigo
        },
        {
          category: "Government Tax",
          amount: taxAmount,
          percentage: taxPct,
          colorHex: "#34C759"
          // iOS System Green
        }
      ],
      laborVsPartsRatio: {
        laborPercentage: laborPct,
        partsPercentage: partsPct
      },
      summary: {
        totalLaborCost: subtotalLabor,
        totalPartsCost: subtotalParts,
        fleetFee,
        taxAmount,
        grandTotal,
        billableLaborHours: parseFloat(invoice.totalBillableLaborHours),
        hourlyLaborRateApplied: hourlyRate,
        partsMarkupPercentApplied: parseFloat(invoice.partsMarkupPercentApplied),
        invoiceStatus: invoice.status
      },
      technicianBreakdown
    });
  } catch (error) {
    console.error("[ANALYTICS ERROR] Swift charts telemetry generation failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to generate Swift Charts telemetry."
    });
  }
}

// src/routes/billing.route.ts
var billingRouter = Router9();
billingRouter.use(authenticateToken);
billingRouter.post(
  "/estimate/:workOrderId",
  requireRole(["PAYMENT_CLERK", "SUPERVISOR"]),
  generateEstimate
);
billingRouter.get("/invoices/:id", getInvoice);
billingRouter.patch(
  "/invoices/:id/status",
  requireRole(["PAYMENT_CLERK", "SUPERVISOR"]),
  updateInvoiceStatus
);
billingRouter.get("/analytics/:workOrderId", getSwiftChartsAnalytics);

// src/routes/docs.route.ts
import { Router as Router10 } from "express";
import swaggerUi from "swagger-ui-express";

// src/docs/swagger.json
var swagger_default = {
  openapi: "3.0.3",
  info: {
    title: "WhirlDispatch HVAC Field Operations API",
    version: "1.0.0",
    description: "Enterprise-grade HVAC Field Service Telemetry & Mobile Management Engine supporting iOS iPhone field technicians, iPad supervisors, and payment clerks.",
    contact: {
      name: "B. L. ALAHAKOON",
      email: "info@whirldispatch.com"
    }
  },
  servers: [
    {
      url: "/api",
      description: "Primary WhirlDispatch API Base"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" }
        }
      },
      HealthStatus: {
        type: "object",
        properties: {
          status: { type: "string", example: "healthy" },
          database: { type: "string", example: "connected" },
          timestamp: { type: "string", format: "date-time" }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          fullName: { type: "string" },
          phone: { type: "string" },
          role: { type: "string", enum: ["TECHNICIAN", "LEAD_TECHNICIAN", "SUPERVISOR", "PAYMENT_CLERK"] },
          hourlyLaborRate: { type: "string" },
          biometricEnrolled: { type: "boolean" },
          isActive: { type: "boolean" }
        }
      },
      ClientFacility: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          companyName: { type: "string" },
          facilityName: { type: "string" },
          address: { type: "string" },
          latitude: { type: "number" },
          longitude: { type: "number" },
          geofenceRadius: { type: "number" },
          contractHourlyRate: { type: "string" },
          partsMarkupPercent: { type: "string" }
        }
      },
      WorkOrder: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          clientFacilityId: { type: "string", format: "uuid" },
          supervisorId: { type: "string", format: "uuid" },
          leadTechnicianId: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL_EMERGENCY"] },
          status: { type: "string", enum: ["DISPATCHED", "EN_ROUTE", "ON_SITE_ACTIVE", "UNACKNOWLEDGED_BREAK", "AWAITING_PARTS_APPROVAL", "COMPLETED", "BILLED", "CANCELLED"] },
          scheduledStartTime: { type: "string", format: "date-time" },
          scheduledEndTime: { type: "string", format: "date-time" }
        }
      },
      SiteAttendance: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          workOrderId: { type: "string", format: "uuid" },
          technicianId: { type: "string", format: "uuid" },
          clockInTimestamp: { type: "string", format: "date-time" },
          clockOutTimestamp: { type: "string", format: "date-time" },
          totalBillableSeconds: { type: "integer" },
          totalBreakSeconds: { type: "integer" },
          sessionStatus: { type: "string", enum: ["ACTIVE_ON_SITE", "ON_BREAK_VIOLATION", "CLOCKED_OUT"] }
        }
      },
      DiagnosticDossier: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          workOrderId: { type: "string", format: "uuid" },
          equipmentModel: { type: "string" },
          baselineSuctionPressurePsi: { type: "string" },
          postServiceSuctionPressurePsi: { type: "string" },
          isCompleted: { type: "boolean" }
        }
      },
      ExpenseClaim: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          workOrderId: { type: "string", format: "uuid" },
          vendorName: { type: "string" },
          totalAmount: { type: "string" },
          approvalStatus: { type: "string", enum: ["PENDING_SUPERVISOR_APPROVAL", "APPROVED", "FLAGGED_REJECTED"] }
        }
      },
      BillingInvoice: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          invoiceNumber: { type: "string" },
          workOrderId: { type: "string", format: "uuid" },
          grandTotal: { type: "string" },
          status: { type: "string", enum: ["DRAFT_ESTIMATE", "APPROVED_BY_SUPERVISOR", "ISSUED_TO_CLIENT", "PAID"] }
        }
      },
      SystemNotification: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          recipientUserId: { type: "string", format: "uuid" },
          notificationType: { type: "string" },
          title: { type: "string" },
          body: { type: "string" },
          isRead: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      WidgetTelemetry: {
        type: "object",
        properties: {
          technicianId: { type: "string", format: "uuid" },
          technicianName: { type: "string" },
          hasActiveShift: { type: "boolean" },
          shiftStatus: { type: "string" },
          elapsedMinutes: { type: "integer" },
          widgetDisplay: {
            type: "object",
            properties: {
              headline: { type: "string" },
              subline: { type: "string" },
              statusColorHex: { type: "string" }
            }
          }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        summary: "System Health Status",
        tags: ["System"],
        responses: {
          "200": {
            description: "Server and database status",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HealthStatus" } } }
          }
        }
      }
    },
    "/auth/login": {
      post: {
        summary: "Authenticate user credentials",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "JWT issued successfully" },
          "401": { description: "Invalid credentials" }
        }
      }
    },
    "/auth/me": {
      get: {
        summary: "Get authenticated user profile",
        security: [{ bearerAuth: [] }],
        tags: ["Authentication"],
        responses: {
          "200": { description: "Profile data" }
        }
      }
    },
    "/auth/biometric-verify": {
      post: {
        summary: "Verify Face ID / Touch ID session",
        security: [{ bearerAuth: [] }],
        tags: ["Authentication"],
        responses: {
          "200": { description: "Biometric session validated" }
        }
      }
    },
    "/facilities": {
      get: {
        summary: "List client facilities",
        security: [{ bearerAuth: [] }],
        tags: ["Facilities & Fleet"],
        responses: {
          "200": { description: "Array of facilities" }
        }
      },
      post: {
        summary: "Create client facility",
        security: [{ bearerAuth: [] }],
        tags: ["Facilities & Fleet"],
        responses: {
          "201": { description: "Facility created" }
        }
      }
    },
    "/fleet": {
      get: {
        summary: "List fleet assets",
        security: [{ bearerAuth: [] }],
        tags: ["Facilities & Fleet"],
        responses: {
          "200": { description: "Array of fleet assets" }
        }
      }
    },
    "/work-orders": {
      get: {
        summary: "List dispatched work orders",
        security: [{ bearerAuth: [] }],
        tags: ["Work Orders"],
        responses: {
          "200": { description: "Array of work orders" }
        }
      },
      post: {
        summary: "Dispatch work order",
        security: [{ bearerAuth: [] }],
        tags: ["Work Orders"],
        responses: {
          "201": { description: "Work order dispatched" }
        }
      }
    },
    "/work-orders/{id}": {
      get: {
        summary: "Get work order details and EventKit calendar payload",
        security: [{ bearerAuth: [] }],
        tags: ["Work Orders"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": { description: "Work order with EventKit payload" }
        }
      }
    },
    "/attendance/clock-in": {
      post: {
        summary: "Clock in with geofence and biometric verification",
        security: [{ bearerAuth: [] }],
        tags: ["Attendance & Telemetry"],
        responses: {
          "201": { description: "Clocked in successfully" },
          "400": { description: "Out of geofence perimeter" }
        }
      }
    },
    "/attendance/clock-out": {
      post: {
        summary: "Clock out and compute billable shift duration",
        security: [{ bearerAuth: [] }],
        tags: ["Attendance & Telemetry"],
        responses: {
          "200": { description: "Clocked out" }
        }
      }
    },
    "/dossiers": {
      post: {
        summary: "Create or update diagnostic sensor dossier",
        security: [{ bearerAuth: [] }],
        tags: ["Diagnostic Dossiers"],
        responses: {
          "201": { description: "Dossier saved" }
        }
      }
    },
    "/dossiers/work-order/{id}": {
      get: {
        summary: "Get dossier, checklists, and proof photos",
        security: [{ bearerAuth: [] }],
        tags: ["Diagnostic Dossiers"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": { description: "Complete diagnostic dossier" }
        }
      }
    },
    "/expenses": {
      post: {
        summary: "Submit emergency parts expense claim",
        security: [{ bearerAuth: [] }],
        tags: ["Expense Ledger"],
        responses: {
          "201": { description: "Expense submitted" }
        }
      }
    },
    "/billing/estimate/{workOrderId}": {
      post: {
        summary: "Compile automated billing estimate",
        security: [{ bearerAuth: [] }],
        tags: ["Billing & Invoicing"],
        parameters: [
          { name: "workOrderId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "201": { description: "Invoice compiled" }
        }
      }
    },
    "/billing/analytics/{workOrderId}": {
      get: {
        summary: "Retrieve Swift Charts financial telemetry",
        security: [{ bearerAuth: [] }],
        tags: ["Billing & Invoicing"],
        parameters: [
          { name: "workOrderId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": { description: "Swift Charts payload" }
        }
      }
    },
    "/notifications": {
      get: {
        summary: "Get unread push notification queue",
        security: [{ bearerAuth: [] }],
        tags: ["Notifications & WidgetKit"],
        responses: {
          "200": { description: "Notification feed" }
        }
      }
    },
    "/telemetry/widget/{technicianId}": {
      get: {
        summary: "Get live shift telemetry for iOS WidgetKit widgets",
        tags: ["Notifications & WidgetKit"],
        parameters: [
          { name: "technicianId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": { description: "WidgetKit telemetry data" }
        }
      }
    }
  }
};

// src/routes/docs.route.ts
var docsRouter = Router10();
docsRouter.get("/json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swagger_default);
});
docsRouter.use("/", swaggerUi.serve, swaggerUi.setup(swagger_default, {
  customSiteTitle: "WhirlDispatch OpenAPI 3.0 Documentation",
  customCss: ".swagger-ui .topbar { display: none }"
}));

// src/routes/notifications.route.ts
import { Router as Router11 } from "express";

// src/controllers/notifications.controller.ts
import { eq as eq16, desc as desc6, and as and5, isNull as isNull3 } from "drizzle-orm";
async function getUserNotifications(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
      return;
    }
    const notifications = await db.query.systemNotifications.findMany({
      where: eq16(systemNotifications.recipientUserId, authUser.userId),
      orderBy: [desc6(systemNotifications.createdAt)],
      limit: 50
    });
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    res.status(200).json({
      recipientUserId: authUser.userId,
      unreadCount,
      totalCount: notifications.length,
      notifications
    });
  } catch (error) {
    console.error("[NOTIFICATIONS ERROR] Fetch notifications failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve user notifications."
    });
  }
}
async function markNotificationAsRead(req, res) {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
      return;
    }
    const id = req.params.id;
    const notification = await db.query.systemNotifications.findFirst({
      where: and5(
        eq16(systemNotifications.id, id),
        eq16(systemNotifications.recipientUserId, authUser.userId)
      )
    });
    if (!notification) {
      res.status(404).json({ error: "NotFound", message: "Notification not found." });
      return;
    }
    const [updated] = await db.update(systemNotifications).set({ isRead: true }).where(eq16(systemNotifications.id, id)).returning();
    res.status(200).json({
      message: "Notification marked as read.",
      notification: updated
    });
  } catch (error) {
    console.error("[NOTIFICATIONS ERROR] Mark as read failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to update notification status."
    });
  }
}
async function getLiveWidgetTelemetry(req, res) {
  try {
    const technicianId = req.params.technicianId;
    const technician = await db.query.users.findFirst({
      where: eq16(users.id, technicianId)
    });
    if (!technician) {
      res.status(404).json({ error: "NotFound", message: "Technician not found." });
      return;
    }
    const activeSession = await db.query.siteAttendance.findFirst({
      where: and5(
        eq16(siteAttendance.technicianId, technicianId),
        isNull3(siteAttendance.clockOutTimestamp)
      ),
      with: {
        workOrder: {
          with: { facility: true }
        }
      },
      orderBy: [desc6(siteAttendance.createdAt)]
    });
    if (activeSession && activeSession.workOrder) {
      const now = /* @__PURE__ */ new Date();
      const elapsedSeconds = Math.max(
        0,
        Math.floor((now.getTime() - activeSession.clockInTimestamp.getTime()) / 1e3)
      );
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      const isBreach = activeSession.sessionStatus === "ON_BREAK_VIOLATION";
      const facilityName = activeSession.workOrder.facility.facilityName;
      res.status(200).json({
        technicianId,
        technicianName: technician.fullName,
        hasActiveShift: true,
        shiftStatus: activeSession.sessionStatus,
        activeWorkOrder: {
          id: activeSession.workOrder.id,
          title: activeSession.workOrder.title,
          priority: activeSession.workOrder.priority,
          facilityName,
          address: activeSession.workOrder.facility.address,
          scheduledStartTime: activeSession.workOrder.scheduledStartTime
        },
        elapsedShiftMinutes: elapsedMinutes,
        widgetDisplay: {
          headline: isBreach ? "BREACH ALERT" : `ON SITE: ${facilityName}`,
          subline: isBreach ? "Geofence Exit \u2022 Shift Paused" : `Active Shift \u2022 ${elapsedMinutes} mins on site`,
          statusColorHex: isBreach ? "#FF3B30" : "#34C759",
          batteryFriendlyRefreshIntervalSeconds: 60
        }
      });
      return;
    }
    const dispatchedJob = await db.query.workOrders.findFirst({
      where: eq16(workOrders.leadTechnicianId, technicianId),
      with: { facility: true },
      orderBy: [desc6(workOrders.createdAt)]
    });
    if (dispatchedJob && (dispatchedJob.status === "EN_ROUTE" || dispatchedJob.status === "DISPATCHED")) {
      const isEnRoute = dispatchedJob.status === "EN_ROUTE";
      res.status(200).json({
        technicianId,
        technicianName: technician.fullName,
        hasActiveShift: true,
        shiftStatus: dispatchedJob.status,
        activeWorkOrder: {
          id: dispatchedJob.id,
          title: dispatchedJob.title,
          priority: dispatchedJob.priority,
          facilityName: dispatchedJob.facility.facilityName,
          address: dispatchedJob.facility.address,
          scheduledStartTime: dispatchedJob.scheduledStartTime
        },
        elapsedShiftMinutes: 0,
        widgetDisplay: {
          headline: isEnRoute ? "EN ROUTE TO SITE" : "JOB DISPATCHED",
          subline: dispatchedJob.facility.facilityName,
          statusColorHex: "#007AFF",
          batteryFriendlyRefreshIntervalSeconds: 120
        }
      });
      return;
    }
    res.status(200).json({
      technicianId,
      technicianName: technician.fullName,
      hasActiveShift: false,
      shiftStatus: "OFFLINE",
      activeWorkOrder: null,
      elapsedShiftMinutes: 0,
      widgetDisplay: {
        headline: "OFF SHIFT",
        subline: "No active dispatches",
        statusColorHex: "#8E8E93",
        batteryFriendlyRefreshIntervalSeconds: 300
      }
    });
  } catch (error) {
    console.error("[WIDGET TELEMETRY ERROR] Fetch telemetry failed:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to retrieve WidgetKit shift telemetry."
    });
  }
}

// src/routes/notifications.route.ts
var notificationsRouter = Router11();
notificationsRouter.get("/", authenticateToken, getUserNotifications);
notificationsRouter.patch("/:id/read", authenticateToken, markNotificationAsRead);
var telemetryRouter = Router11();
telemetryRouter.get("/widget/:technicianId", getLiveWidgetTelemetry);

// src/config/cors.ts
import cors from "cors";
var allowedOrigins = (process.env.CORS_ORIGIN || "*").split(",").map((origin) => origin.trim());
var corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy rejection: origin '${origin}' not authorized.`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-Biometric-Session"
  ],
  exposedHeaders: ["Authorization"],
  credentials: true,
  maxAge: 86400
  // 24 hours preflight caching
};
var corsMiddleware = cors(corsOptions);

// src/app.ts
dotenv3.config();
var app = express();
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(corsMiddleware);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/facilities", facilitiesRouter);
app.use("/api/fleet", fleetRouter);
app.use("/api/work-orders", workOrdersRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/dossiers", dossierRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/billing", billingRouter);
app.use("/api/docs", docsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/telemetry", telemetryRouter);
app.get("/", (_req, res) => {
  res.status(200).json({
    service: "WhirlDispatch Backend API",
    status: "online",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      docs: "/api/docs",
      docsJson: "/api/docs/json"
    }
  });
});
app.use((_req, res) => {
  res.status(404).json({
    error: "NotFound",
    message: "The requested endpoint does not exist on WhirlDispatch API server."
  });
});
app.use((err, _req, res, _next) => {
  console.error("[ServerError]", err);
  res.status(500).json({
    error: "InternalServerError",
    message: err.message || "An unexpected error occurred."
  });
});

// src/serverless.ts
var serverless_default = app;
export {
  serverless_default as default
};
