const express = require('express');
const router = express.Router();
const {
  assignTraining,
  getAllAssignments,
  getAssignmentById,
  updateAssignmentStatus,
  deleteAssignment,
  getProgressSummary,
} = require('../controllers/assignmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);

// Progress summary — must come before /:id to avoid route conflict
router.get('/progress', authorizeRoles('admin'), getProgressSummary);

router.get('/', getAllAssignments);
router.get('/:id', getAssignmentById);

router.post('/', authorizeRoles('admin'), assignTraining);
router.patch('/:id/status', updateAssignmentStatus);
router.delete('/:id', authorizeRoles('admin'), deleteAssignment);

module.exports = router;
