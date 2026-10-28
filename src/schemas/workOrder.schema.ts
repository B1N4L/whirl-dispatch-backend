import { z } from 'zod';

export const createWorkOrderSchema = z.object({
  clientFacilityId: z.string().uuid('Valid client facility UUID required'),
  leadTechnicianId: z.string().uuid('Valid lead technician UUID required'),
  assignedFleetAssetId: z.string().uuid('Valid fleet asset UUID required').optional().nullable(),
  assignedTechnicianIds: z.array(z.string().uuid()).default([]),
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  description: z.string().min(10, 'Detailed breakdown/task description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL_EMERGENCY']).default('MEDIUM'),
  scheduledStartTime: z.string().datetime('ISO 8601 scheduled start timestamp required'),
  scheduledEndTime: z.string().datetime('ISO 8601 scheduled end timestamp required'),
});

export const updateWorkOrderStatusSchema = z.object({
  status: z.enum([
    'DISPATCHED',
    'EN_ROUTE',
    'ON_SITE_ACTIVE',
    'UNACKNOWLEDGED_BREAK',
    'AWAITING_PARTS_APPROVAL',
    'COMPLETED',
    'BILLED',
    'CANCELLED',
  ]),
  actualStartTime: z.string().datetime().optional().nullable(),
  actualEndTime: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderStatusInput = z.infer<typeof updateWorkOrderStatusSchema>;

export const recordTelemetrySchema = z.object({
  latitude: z.number().min(-90).max(90, 'Valid latitude required'),
  longitude: z.number().min(-180).max(180, 'Valid longitude required'),
  accuracyMeters: z.number().min(0).default(5.0),
  batteryLevel: z.number().int().min(0).max(100).optional(),
});

export type RecordTelemetryInput = z.infer<typeof recordTelemetrySchema>;
