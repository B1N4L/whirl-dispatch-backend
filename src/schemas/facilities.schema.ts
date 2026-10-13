import { z } from 'zod';

export const createFacilitySchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  facilityName: z.string().min(2, 'Facility name is required'),
  address: z.string().min(5, 'Physical address is required'),
  latitude: z.number().min(-90).max(90, 'Valid latitude coordinate required'),
  longitude: z.number().min(-180).max(180, 'Valid longitude coordinate required'),
  geofenceRadius: z.number().positive().default(100.0),
  contactPersonName: z.string().min(2, 'Contact person name is required'),
  contactPhone: z.string().min(5, 'Contact phone is required'),
  contactEmail: z.string().email().optional(),
  contractStartDate: z.string().datetime().optional(),
  contractEndDate: z.string().datetime().optional(),
  slaResponseHours: z.number().int().positive().default(4),
  contractHourlyRate: z.string().regex(/^\d+(\.\d{1,2})?$/).default('75.00'),
  partsMarkupPercent: z.string().regex(/^\d+(\.\d{1,2})?$/).default('15.00'),
});

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;
