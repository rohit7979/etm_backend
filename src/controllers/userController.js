const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Training = require('../models/Training');


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
    const [totalEmployees, totalTrainings, totalAssignments, completedAssignments, inProgressAssignments, pendingAssignments] =
      await Promise.all([
        User.countDocuments({ role: 'employee' }),
        Training.countDocuments(),
        Assignment.countDocuments(),
        Assignment.countDocuments({ status: 'completed' }),
        Assignment.countDocuments({ status: 'in_progress' }), // fixed: was 'in-progress'
        Assignment.countDocuments({ status: 'pending' }),
      ]);

    // Average completion rate across all employees
    const avgCompletionRate =
      totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

    res.status(200).json({
      totalEmployees,
      totalTrainings,
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      pendingAssignments,
      avgCompletionRate,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Get all admin dashboard stats in one call
// @route   GET /api/users/dashboard
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
  try {
    // Run all DB queries in parallel for performance
    const [
      totalTrainings,
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      pendingAssignments,
      totalEmployees,
      activeEmployeesResult,
    ] = await Promise.all([
      Training.countDocuments(),
      Assignment.countDocuments(),
      Assignment.countDocuments({ status: 'completed' }),
      Assignment.countDocuments({ status: 'in_progress' }),
      Assignment.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'employee' }),
      // Employees who have at least 1 assignment
      Assignment.distinct('employee'),
    ]);

    // Average completion rate across all assignments
    const avgCompletionRate =
      totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

    res.status(200).json({
      totalTrainings,
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      pendingAssignments,
      avgCompletionRate,        // e.g. 67  (means 67%)
      totalEmployees,
      activeEmployees: activeEmployeesResult.length, // employees with assignments
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Get analytics data for Recharts (category breakdown + monthly trends)
// @route   GET /api/users/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    // 1. Assignment status breakdown (for pie/donut chart)
    const statusBreakdown = await Assignment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
    ]);

    // 2. Category-wise assignment breakdown (for bar chart)
    const categoryBreakdown = await Assignment.aggregate([
      {
        $lookup: {
          from: 'trainings',
          localField: 'training',
          foreignField: '_id',
          as: 'training',
        },
      },
      { $unwind: '$training' },
      {
        $group: {
          _id: '$training.category',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: 1,
          completed: 1,
          inProgress: 1,
          pending: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    // 3. Monthly completions for the last 6 months (for line/area chart)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrends = await Assignment.aggregate([
      {
        $match: {
          completedAt: { $gte: sixMonthsAgo },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' },
          },
          completed: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          completed: 1,
          // Short month label for Recharts x-axis
          label: {
            $let: {
              vars: {
                months: [
                  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                ],
              },
              in: { $arrayElemAt: ['$$months', '$_id.month'] },
            },
          },
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    // 4. Top 5 employees by completion rate (for leaderboard / bar chart)
    const topEmployees = await Assignment.aggregate([
      {
        $group: {
          _id: '$employee',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: '$employee' },
      {
        $project: {
          _id: 0,
          name: '$employee.name',
          total: 1,
          completed: 1,
          completionRate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$completed', '$total'] }, 100] }, 1] },
            ],
          },
        },
      },
      { $sort: { completionRate: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      statusBreakdown,
      categoryBreakdown,
      monthlyTrends,
      topEmployees,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = { getActiveEmployees, getEmployeeById, getEmployeeStats, getAdminDashboard, getAnalytics };
