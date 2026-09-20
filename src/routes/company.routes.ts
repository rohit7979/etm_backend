import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateRequest } from '../middlewares/validate';
import {
  createCompanySchema,
  updateCompanyStatusSchema,
  createCompanyAdminSchema,
} from '../validators/company.validator';

const router = Router();

// Super Admin platform protection on all company endpoints
router.use(authenticate, requireRole('SUPER_ADMIN'));

router.post('/', validateRequest(createCompanySchema), CompanyController.createCompany);
router.get('/', CompanyController.listCompanies);
router.get('/:id', CompanyController.getCompanyById);
router.patch('/:id/status', validateRequest(updateCompanyStatusSchema), CompanyController.updateStatus);
router.post('/:id/admins', validateRequest(createCompanyAdminSchema), CompanyController.createCompanyAdmin);
router.get('/:id/admins', CompanyController.listCompanyAdmins);

export default router;
