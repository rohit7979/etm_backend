const express = require('express');
const router = express.Router();
const { getActiveEmployees, getEmployeeById, getEmployeeStats } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All routes below are admin-only
router.use(protect, authorizeRoles('admin'));

// GET /api/users/stats  - summary counts for admin dashboard
router.get('/stats', getEmployeeStats);

// GET /api/users/employees  - list all active employees
router.get('/employees', getActiveEmployees);

// GET /api/users/employees/:id  - single employee detail with assignments
router.get('/employees/:id', getEmployeeById);

module.exports = router;
