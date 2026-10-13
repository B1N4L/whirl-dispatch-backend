import { Router } from 'express';
import {
  getFleetAssets,
  getFleetAssetById,
  createFleetAsset,
  updateFleetAssetStatus,
} from '../controllers/fleet.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

export const fleetRouter = Router();

fleetRouter.use(authenticateToken);

fleetRouter.get('/', getFleetAssets);
fleetRouter.get('/:id', getFleetAssetById);
fleetRouter.post('/', requireRole(['SUPERVISOR']), createFleetAsset);
fleetRouter.patch('/:id/status', requireRole(['SUPERVISOR', 'LEAD_TECHNICIAN']), updateFleetAssetStatus);
