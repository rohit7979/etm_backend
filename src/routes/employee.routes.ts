import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { requireTenant } from '../middlewares/tenant.middleware';
import { validateRequest } from '../middlewares/validate';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from '../validators/employee.validator';

const router = Router();

// Only authenticated Company Admins with a valid tenant context can manage employees
router.use(authenticate, requireRole('COMPANY_ADMIN'), requireTenant);

router.get('/', EmployeeController.listEmployees);
router.get('/:id', EmployeeController.getEmployeeById);
router.post('/', validateRequest(createEmployeeSchema), EmployeeController.createEmployee);
router.patch('/:id', validateRequest(updateEmployeeSchema), EmployeeController.updateEmployee);

export default router;
