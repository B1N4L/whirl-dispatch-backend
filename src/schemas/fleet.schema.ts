import { z } from 'zod';

export const createFleetAssetSchema = z.object({
  assetCode: z.string().min(2, 'Asset code is required (e.g. VAN-04, CRANE-02)'),
  name: z.string().min(2, 'Asset name is required'),
  assetType: z.enum(['VAN', 'CRANE_TRUCK', 'SERVICE_TRUCK', 'RECOVERY_TRAILER']).default('VAN'),
  licensePlate: z.string().min(2, 'License plate is required'),
  status: z.enum(['AVAILABLE', 'DEPLOYED', 'UNDER_MAINTENANCE']).default('AVAILABLE'),
});

export const updateFleetStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'DEPLOYED', 'UNDER_MAINTENANCE']),
});

export type CreateFleetAssetInput = z.infer<typeof createFleetAssetSchema>;
export type UpdateFleetStatusInput = z.infer<typeof updateFleetStatusSchema>;
