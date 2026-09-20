import { Router } from 'express';
import { TrainingController } from '../controllers/training.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { requireTenant } from '../middlewares/tenant.middleware';
import { validateRequest } from '../middlewares/validate';
import {
  createTrainingSchema,
  updateTrainingSchema,
} from '../validators/training.validator';

const router = Router();

// All training endpoints require authentication and tenant context
router.use(authenticate, requireTenant);

// Read trainings - both COMPANY_ADMIN and EMPLOYEE in the tenant can view
router.get('/', TrainingController.listTrainings);
router.get('/:id', TrainingController.getTrainingById);

// Manage trainings - restricted to COMPANY_ADMIN
router.post(
  '/',
  requireRole('COMPANY_ADMIN'),
  validateRequest(createTrainingSchema),
  TrainingController.createTraining
);

router.put(
  '/:id',
  requireRole('COMPANY_ADMIN'),
  validateRequest(updateTrainingSchema),
  TrainingController.updateTraining
);

router.delete(
  '/:id',
  requireRole('COMPANY_ADMIN'),
  TrainingController.deleteTraining
);

export default router;
