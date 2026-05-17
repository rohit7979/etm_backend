const express = require('express');
const router = express.Router();
const { getActiveEmployees, getEmployeeById, getEmployeeStats, getAdminDashboard, getAnalytics } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All routes below are admin-only
router.use(protect, authorizeRoles('admin'));

// GET /api/users/dashboard  - all stats for admin dashboard in one call
router.get('/dashboard', getAdminDashboard);

// GET /api/users/stats  - summary counts for admin dashboard
router.get('/stats', getEmployeeStats);

// GET /api/users/employees  - list all active employees
router.get('/employees', getActiveEmployees);

// GET /api/users/employees/:id  - single employee detail with assignments
router.get('/employees/:id', getEmployeeById);

// GET /api/users/analytics  - chart data for Recharts (category, monthly, top employees)
router.get('/analytics', getAnalytics);

module.exports = router;
