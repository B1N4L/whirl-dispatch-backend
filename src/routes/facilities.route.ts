import { Router } from 'express';
import { getFacilities, getFacilityById, createFacility } from '../controllers/facilities.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

export const facilitiesRouter = Router();

facilitiesRouter.use(authenticateToken);

facilitiesRouter.get('/', getFacilities);
facilitiesRouter.get('/:id', getFacilityById);
facilitiesRouter.post('/', requireRole(['SUPERVISOR']), createFacility);
