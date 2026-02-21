const express = require('express');
const router = express.Router();
const {
  createTraining,
  getAllTrainings,
  getTrainingById,
  updateTraining,
  deleteTraining,
} = require('../controllers/trainingController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAllTrainings);
router.get('/:id', getTrainingById);

router.post('/', authorizeRoles('admin'), createTraining);
router.put('/:id', authorizeRoles('admin'), updateTraining);
router.delete('/:id', authorizeRoles('admin'), deleteTraining);

module.exports = router;
