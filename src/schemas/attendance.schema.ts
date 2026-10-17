import { z } from 'zod';

export const clockInSchema = z.object({
  workOrderId: z.string().uuid('Valid work order UUID required'),
  latitude: z.number().min(-90).max(90, 'Valid latitude required'),
  longitude: z.number().min(-180).max(180, 'Valid longitude required'),
  accuracyMeters: z.number().nonnegative().default(5.0),
  biometricVerified: z.boolean().default(false),
});

export const clockOutSchema = z.object({
  workOrderId: z.string().uuid('Valid work order UUID required'),
  latitude: z.number().min(-90).max(90, 'Valid latitude required'),
  longitude: z.number().min(-180).max(180, 'Valid longitude required'),
  accuracyMeters: z.number().nonnegative().default(5.0),
});

export const boundaryEventSchema = z.object({
  workOrderId: z.string().uuid('Valid work order UUID required'),
  eventType: z.enum([
    'GEOFENCE_ENTER',
    'GEOFENCE_EXIT_BREACH',
    'BREAK_PAUSED',
    'BIOMETRIC_REAUTH_RESUME',
    'SUPERVISOR_OVERRIDE',
  ]),
  latitude: z.number().min(-90).max(90, 'Valid latitude required'),
  longitude: z.number().min(-180).max(180, 'Valid longitude required'),
  accuracyMeters: z.number().nonnegative().default(5.0),
  notes: z.string().optional(),
});

export const resumeShiftSchema = z.object({
  workOrderId: z.string().uuid('Valid work order UUID required'),
  latitude: z.number().min(-90).max(90, 'Valid latitude required'),
  longitude: z.number().min(-180).max(180, 'Valid longitude required'),
  accuracyMeters: z.number().nonnegative().default(5.0),
  biometricVerified: z.boolean().refine((val) => val === true, {
    message: 'Biometric verification (Face ID/Touch ID) required to resume shift after boundary breach.',
  }),
});

export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
export type BoundaryEventInput = z.infer<typeof boundaryEventSchema>;
export type ResumeShiftInput = z.infer<typeof resumeShiftSchema>;
