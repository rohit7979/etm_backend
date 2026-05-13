const User = require('../models/User');
const Assignment = require('../models/Assignment');

// @desc    Get all active employees (admin only)
// @route   GET /api/users/employees
// @access  Private/Admin
const getActiveEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });

    // Enrich each employee with their assignment count
    const enriched = await Promise.all(
      employees.map(async (emp) => {
        const totalAssignments = await Assignment.countDocuments({ employee: emp._id });
        const completedAssignments = await Assignment.countDocuments({
          employee: emp._id,
          status: 'completed',
        });
        return {
          id: emp._id,
          name: emp.name,
          email: emp.email,
          role: emp.role,
          joinedAt: emp.createdAt,
          totalAssignments,
          completedAssignments,
          pendingAssignments: totalAssignments - completedAssignments,
        };
      })
    );

    res.status(200).json({
      count: enriched.length,
      employees: enriched,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Get a single employee by ID (admin only)
// @route   GET /api/users/employees/:id
// @access  Private/Admin
const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, role: 'employee' }).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const assignments = await Assignment.find({ employee: employee._id }).populate('training', 'title category');

    res.status(200).json({
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        joinedAt: employee.createdAt,
      },
      assignments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Get employee stats summary (admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalAssignments = await Assignment.countDocuments();
    const completedAssignments = await Assignment.countDocuments({ status: 'completed' });
    const inProgressAssignments = await Assignment.countDocuments({ status: 'in-progress' });
    const pendingAssignments = await Assignment.countDocuments({ status: 'pending' });

    res.status(200).json({
      totalEmployees,
      totalAdmins,
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      pendingAssignments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = { getActiveEmployees, getEmployeeById, getEmployeeStats };
