const express = require('express');
const router = express.Router();
const {
  assignTraining,
  getAllAssignments,
  getAssignmentById,
  updateAssignmentStatus,
  deleteAssignment,
  getProgressSummary,
  getMyStats,
} = require('../controllers/assignmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const commentRouter = require('./comment');

router.use(protect);

// Static routes — must come before /:id to avoid conflicts
router.get('/progress', authorizeRoles('admin'), getProgressSummary);
router.get('/my-stats', getMyStats);

router.get('/', getAllAssignments);
router.get('/:id', getAssignmentById);

router.post('/', authorizeRoles('admin'), assignTraining);
router.patch('/:id/status', updateAssignmentStatus);
router.delete('/:id', authorizeRoles('admin'), deleteAssignment);

// Nested comment routes: /api/assignments/:id/comments
router.use('/:id/comments', commentRouter);

module.exports = router;
