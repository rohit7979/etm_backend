import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import employeeRoutes from './employee.routes';
import companyAdminRoutes from './companyAdmin.routes';
import trainingRoutes from './training.routes';
import assignmentRoutes from './assignment.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/company-admins', companyAdminRoutes);
router.use('/employees', employeeRoutes);
router.use('/trainings', trainingRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', dashboardRoutes); // Supports legacy frontend endpoints (/users/dashboard, /users/analytics, /users/employees)

export default router;
