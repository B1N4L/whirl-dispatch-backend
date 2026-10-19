import { z } from 'zod';

export const checklistCategoryEnum = z.enum([
  'COMPRESSOR_SYSTEM',
  'REFRIGERANT_CIRCUIT',
  'ELECTRICAL_CONTROLS',
  'CONDENSER_AIR_FLOW',
]);

export const photoTypeEnum = z.enum([
  'BASELINE_BEFORE',
  'POST_SERVICE_AFTER',
  'DEFECT_EVIDENCE',
  'REPLACED_PART',
]);

export const createOrUpdateDossierSchema = z.object({
  workOrderId: z.string().uuid('Valid work order UUID required'),
  equipmentModel: z.string().min(1, 'Equipment model is required'),
  equipmentSerialNumber: z.string().optional(),
  baselineSuctionPressurePsi: z.number().optional(),
  postServiceSuctionPressurePsi: z.number().optional(),
  baselineDischargePressurePsi: z.number().optional(),
  postServiceDischargePressurePsi: z.number().optional(),
  baselineMotorRunningAmps: z.number().optional(),
  postServiceMotorRunningAmps: z.number().optional(),
  baselineCoilTempDifferential: z.number().optional(),
  postServiceCoilTempDifferential: z.number().optional(),
  diagnosticNotes: z.string().optional(),
  isCompleted: z.boolean().optional(),
});

export const checklistItemSchema = z.object({
  category: checklistCategoryEnum,
  itemLabel: z.string().min(1, 'Item label is required'),
  isChecked: z.boolean().default(false),
  notes: z.string().optional(),
});

export const submitChecklistSchema = z.object({
  items: z.array(checklistItemSchema).min(1, 'At least one checklist item required'),
});

export const attachProofPhotoSchema = z.object({
  photoType: photoTypeEnum,
  photoUrl: z.string().min(1, 'Photo URL or base64 data string is required'),
  capturedLatitude: z.number().min(-90).max(90, 'Valid latitude required'),
  capturedLongitude: z.number().min(-180).max(180, 'Valid longitude required'),
  isLiveCameraCaptured: z.boolean().default(true),
  capturedTimestamp: z.string().datetime().optional(),
});

export type CreateOrUpdateDossierInput = z.infer<typeof createOrUpdateDossierSchema>;
export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;
export type SubmitChecklistInput = z.infer<typeof submitChecklistSchema>;
export type AttachProofPhotoInput = z.infer<typeof attachProofPhotoSchema>;
