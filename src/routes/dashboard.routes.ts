import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { requireTenant } from '../middlewares/tenant.middleware';

const router = Router();

router.use(authenticate, requireRole('COMPANY_ADMIN'), requireTenant);

router.get('/dashboard', DashboardController.getDashboard);
router.get('/analytics', DashboardController.getAnalytics);
router.get('/stats', DashboardController.getDashboard);
router.get('/employees', DashboardController.getEmployees);

export default router;
