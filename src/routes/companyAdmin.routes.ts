import { Router } from 'express';
import { CompanyAdminController } from '../controllers/companyAdmin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateRequest } from '../middlewares/validate';
import { provisionCompanyAdminSchema } from '../validators/company.validator';

const router = Router();

// Only Super Admin can provision company admins
router.use(authenticate, requireRole('SUPER_ADMIN'));

router.post('/provision', validateRequest(provisionCompanyAdminSchema), CompanyAdminController.provision);

export default router;
