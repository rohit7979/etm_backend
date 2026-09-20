import { Router } from 'express';
import { AssignmentController } from '../controllers/assignment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { requireTenant } from '../middlewares/tenant.middleware';
import { validateRequest } from '../middlewares/validate';
import {
  createAssignmentSchema,
  updateAssignmentStatusSchema,
  addCommentSchema,
} from '../validators/assignment.validator';

const router = Router();

// All assignment endpoints require authentication and tenant context
router.use(authenticate, requireTenant);

// Static routes — must come before /:id to avoid param collision
router.get(
  '/progress',
  requireRole('COMPANY_ADMIN'),
  AssignmentController.getProgressSummary
);

router.get('/my-stats', AssignmentController.getMyStats);

// List and single assignment
router.get('/', AssignmentController.listAssignments);
router.get('/:id', AssignmentController.getAssignmentById);

// Create assignment (Company Admin only)
router.post(
  '/',
  requireRole('COMPANY_ADMIN'),
  validateRequest(createAssignmentSchema),
  AssignmentController.createAssignment
);

// Update status (Employee or Company Admin)
router.patch(
  '/:id/status',
  validateRequest(updateAssignmentStatusSchema),
  AssignmentController.updateStatus
);

// Delete assignment (Company Admin only)
router.delete(
  '/:id',
  requireRole('COMPANY_ADMIN'),
  AssignmentController.deleteAssignment
);

// Comments
router.get('/:id/comments', AssignmentController.getComments);
router.post(
  '/:id/comments',
  validateRequest(addCommentSchema),
  AssignmentController.addComment
);
router.delete('/:id/comments/:commentId', AssignmentController.deleteComment);

export default router;
