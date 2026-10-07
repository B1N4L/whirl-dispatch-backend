CREATE TYPE "public"."user_role" AS ENUM('TECHNICIAN', 'LEAD_TECHNICIAN', 'SUPERVISOR', 'PAYMENT_CLERK');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('AVAILABLE', 'DEPLOYED', 'UNDER_MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."asset_type" AS ENUM('VAN', 'CRANE_TRUCK', 'SERVICE_TRUCK', 'RECOVERY_TRAILER');--> statement-breakpoint
CREATE TYPE "public"."work_order_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL_EMERGENCY');--> statement-breakpoint
CREATE TYPE "public"."work_order_status" AS ENUM('DISPATCHED', 'EN_ROUTE', 'ON_SITE_ACTIVE', 'UNACKNOWLEDGED_BREAK', 'AWAITING_PARTS_APPROVAL', 'COMPLETED', 'BILLED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."geofence_event_type" AS ENUM('GEOFENCE_ENTER', 'GEOFENCE_EXIT_BREACH', 'BREAK_PAUSED', 'BIOMETRIC_REAUTH_RESUME', 'SUPERVISOR_OVERRIDE');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('CLOCKED_IN', 'ACTIVE_ON_SITE', 'ON_BREAK_VIOLATION', 'CLOCKED_OUT');--> statement-breakpoint
CREATE TYPE "public"."checklist_category" AS ENUM('COMPRESSOR_SYSTEM', 'REFRIGERANT_CIRCUIT', 'ELECTRICAL_CONTROLS', 'CONDENSER_AIR_FLOW');--> statement-breakpoint
CREATE TYPE "public"."photo_type" AS ENUM('BASELINE_BEFORE', 'POST_SERVICE_AFTER', 'DEFECT_EVIDENCE', 'REPLACED_PART');--> statement-breakpoint
CREATE TYPE "public"."expense_approval_status" AS ENUM('PENDING_SUPERVISOR_APPROVAL', 'APPROVED', 'FLAGGED_REJECTED');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT_ESTIMATE', 'APPROVED_BY_SUPERVISOR', 'ISSUED_TO_CLIENT', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('URGENT_DISPATCH', 'GEOFENCE_BREACH_ALERT', 'EXPENSE_THRESHOLD_ALERT', 'EXPENSE_APPROVED', 'JOB_COMPLETED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"role" "user_role" DEFAULT 'TECHNICIAN' NOT NULL,
	"hourly_labor_rate" numeric(10, 2) DEFAULT '50.00' NOT NULL,
	"biometric_enrolled" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "client_facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"facility_name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"geofence_radius" double precision DEFAULT 100 NOT NULL,
	"contact_person_name" varchar(255) NOT NULL,
	"contact_phone" varchar(50) NOT NULL,
	"contact_email" varchar(255),
	"contract_start_date" timestamp with time zone,
	"contract_end_date" timestamp with time zone,
	"sla_response_hours" integer DEFAULT 4 NOT NULL,
	"contract_hourly_rate" numeric(10, 2) DEFAULT '75.00' NOT NULL,
	"parts_markup_percent" numeric(5, 2) DEFAULT '15.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fleet_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"asset_type" "asset_type" DEFAULT 'VAN' NOT NULL,
	"license_plate" varchar(50) NOT NULL,
	"status" "asset_status" DEFAULT 'AVAILABLE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fleet_assets_asset_code_unique" UNIQUE("asset_code")
);
--> statement-breakpoint
CREATE TABLE "work_order_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"technician_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_number" varchar(50) NOT NULL,
	"client_facility_id" uuid NOT NULL,
	"supervisor_id" uuid NOT NULL,
	"lead_technician_id" uuid NOT NULL,
	"assigned_fleet_asset_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"priority" "work_order_priority" DEFAULT 'MEDIUM' NOT NULL,
	"status" "work_order_status" DEFAULT 'DISPATCHED' NOT NULL,
	"scheduled_start_time" timestamp with time zone NOT NULL,
	"scheduled_end_time" timestamp with time zone NOT NULL,
	"actual_start_time" timestamp with time zone,
	"actual_end_time" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_orders_work_order_number_unique" UNIQUE("work_order_number")
);
--> statement-breakpoint
CREATE TABLE "geofence_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"technician_id" uuid NOT NULL,
	"site_attendance_id" uuid,
	"event_type" "geofence_event_type" NOT NULL,
	"recorded_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"device_latitude" double precision NOT NULL,
	"device_longitude" double precision NOT NULL,
	"accuracy_meters" double precision DEFAULT 5 NOT NULL,
	"is_tamper_verified" boolean DEFAULT true NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "site_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"technician_id" uuid NOT NULL,
	"clock_in_timestamp" timestamp with time zone NOT NULL,
	"clock_out_timestamp" timestamp with time zone,
	"total_billable_seconds" integer DEFAULT 0 NOT NULL,
	"total_break_seconds" integer DEFAULT 0 NOT NULL,
	"session_status" "session_status" DEFAULT 'CLOCKED_IN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagnostic_dossier_id" uuid NOT NULL,
	"category" "checklist_category" NOT NULL,
	"item_label" varchar(255) NOT NULL,
	"is_checked" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "diagnostic_dossiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"lead_technician_id" uuid NOT NULL,
	"equipment_model" varchar(255) NOT NULL,
	"equipment_serial_number" varchar(100),
	"baseline_suction_pressure_psi" numeric(8, 2),
	"post_service_suction_pressure_psi" numeric(8, 2),
	"baseline_discharge_pressure_psi" numeric(8, 2),
	"post_service_discharge_pressure_psi" numeric(8, 2),
	"baseline_motor_running_amps" numeric(8, 2),
	"post_service_motor_running_amps" numeric(8, 2),
	"baseline_coil_temp_differential" numeric(8, 2),
	"post_service_coil_temp_differential" numeric(8, 2),
	"diagnostic_notes" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diagnostic_dossiers_work_order_id_unique" UNIQUE("work_order_id")
);
--> statement-breakpoint
CREATE TABLE "proof_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagnostic_dossier_id" uuid NOT NULL,
	"photo_type" "photo_type" NOT NULL,
	"photo_url" text NOT NULL,
	"captured_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"captured_latitude" double precision NOT NULL,
	"captured_longitude" double precision NOT NULL,
	"is_live_camera_captured" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"lead_technician_id" uuid NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"receipt_number" varchar(100),
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'LKR' NOT NULL,
	"receipt_image_url" text NOT NULL,
	"receipt_store_latitude" double precision NOT NULL,
	"receipt_store_longitude" double precision NOT NULL,
	"receipt_captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_threshold_exceeded" boolean DEFAULT false NOT NULL,
	"approval_status" "expense_approval_status" DEFAULT 'PENDING_SUPERVISOR_APPROVAL' NOT NULL,
	"reviewed_by_supervisor_id" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_claim_id" uuid NOT NULL,
	"part_description" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"work_order_id" uuid NOT NULL,
	"client_facility_id" uuid NOT NULL,
	"clerk_id" uuid NOT NULL,
	"total_billable_labor_hours" numeric(8, 2) NOT NULL,
	"hourly_labor_rate_applied" numeric(10, 2) NOT NULL,
	"subtotal_labor" numeric(12, 2) NOT NULL,
	"subtotal_approved_parts" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"parts_markup_percent_applied" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"subtotal_parts_with_markup" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"fleet_equipment_fee" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"tax_percent" numeric(5, 2) DEFAULT '8.00' NOT NULL,
	"tax_amount" numeric(12, 2) NOT NULL,
	"grand_total" numeric(12, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT_ESTIMATE' NOT NULL,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_invoices_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "billing_invoices_work_order_id_unique" UNIQUE("work_order_id")
);
--> statement-breakpoint
CREATE TABLE "system_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"work_order_id" uuid,
	"notification_type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_order_assignments" ADD CONSTRAINT "work_order_assignments_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_assignments" ADD CONSTRAINT "work_order_assignments_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_client_facility_id_client_facilities_id_fk" FOREIGN KEY ("client_facility_id") REFERENCES "public"."client_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_lead_technician_id_users_id_fk" FOREIGN KEY ("lead_technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_fleet_asset_id_fleet_assets_id_fk" FOREIGN KEY ("assigned_fleet_asset_id") REFERENCES "public"."fleet_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_audit_logs" ADD CONSTRAINT "geofence_audit_logs_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_audit_logs" ADD CONSTRAINT "geofence_audit_logs_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_audit_logs" ADD CONSTRAINT "geofence_audit_logs_site_attendance_id_site_attendance_id_fk" FOREIGN KEY ("site_attendance_id") REFERENCES "public"."site_attendance"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_attendance" ADD CONSTRAINT "site_attendance_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_attendance" ADD CONSTRAINT "site_attendance_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_diagnostic_dossier_id_diagnostic_dossiers_id_fk" FOREIGN KEY ("diagnostic_dossier_id") REFERENCES "public"."diagnostic_dossiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_dossiers" ADD CONSTRAINT "diagnostic_dossiers_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_dossiers" ADD CONSTRAINT "diagnostic_dossiers_lead_technician_id_users_id_fk" FOREIGN KEY ("lead_technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_photos" ADD CONSTRAINT "proof_photos_diagnostic_dossier_id_diagnostic_dossiers_id_fk" FOREIGN KEY ("diagnostic_dossier_id") REFERENCES "public"."diagnostic_dossiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_lead_technician_id_users_id_fk" FOREIGN KEY ("lead_technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_reviewed_by_supervisor_id_users_id_fk" FOREIGN KEY ("reviewed_by_supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_expense_claim_id_expense_claims_id_fk" FOREIGN KEY ("expense_claim_id") REFERENCES "public"."expense_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_client_facility_id_client_facilities_id_fk" FOREIGN KEY ("client_facility_id") REFERENCES "public"."client_facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_clerk_id_users_id_fk" FOREIGN KEY ("clerk_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_notifications" ADD CONSTRAINT "system_notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_notifications" ADD CONSTRAINT "system_notifications_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE set null ON UPDATE no action;