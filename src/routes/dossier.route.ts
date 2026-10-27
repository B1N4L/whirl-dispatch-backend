import { Router } from 'express';
import {
  createOrUpdateDossier,
  getDossierByWorkOrder,
  submitChecklistItems,
  attachProofPhoto,
} from '../controllers/dossier.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export const dossierRouter = Router();

dossierRouter.use(authenticateToken);

dossierRouter.post('/', createOrUpdateDossier);
dossierRouter.get('/work-order/:id', getDossierByWorkOrder);
dossierRouter.get('/:id', getDossierByWorkOrder);
dossierRouter.patch('/:id', createOrUpdateDossier);
dossierRouter.post('/:id/checklist', submitChecklistItems);
dossierRouter.post('/:id/photos', attachProofPhoto);
