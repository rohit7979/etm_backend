const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Training = require('../models/Training');

// @desc    Assign a training to an employee
// @route   POST /api/assignments
// @access  Private (admin only)
const assignTraining = async (req, res) => {
  try {
    const { employeeId, trainingId } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const training = await Training.findById(trainingId);
    if (!training) {
      return res.status(404).json({ message: 'Training not found.' });
    }

    const existing = await Assignment.findOne({
      employee: employeeId,
      training: trainingId,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: 'This training is already assigned to the employee.' });
    }

    const assignment = await Assignment.create({
      employee: employeeId,
      training: trainingId,
      assignedBy: req.user._id,
    });

    await assignment.populate([
      { path: 'employee', select: 'name email' },
      { path: 'training', select: 'title category durationHours' },
      { path: 'assignedBy', select: 'name email' },
    ]);

    res.status(201).json({ message: 'Training assigned successfully.', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Get all assignments (admin sees all, employee sees own)
// @route   GET /api/assignments
// @access  Private
const getAllAssignments = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { employee: req.user._id };

    const assignments = await Assignment.find(filter)
      .populate('employee', 'name email')
      .populate('training', 'title category durationHours')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: assignments.length, assignments });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Get a single assignment by ID
// @route   GET /api/assignments/:id
// @access  Private
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('employee', 'name email')
      .populate('training', 'title category durationHours description')
      .populate('assignedBy', 'name email');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    // Employees can only view their own assignments
    if (
      req.user.role === 'employee' &&
      assignment.employee._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.status(200).json({ assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Update assignment status (employee marks progress/completion)
// @route   PATCH /api/assignments/:id/status
// @access  Private (employee updates own; admin can update any)
const updateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'in_progress', 'completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}.`,
      });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    if (
      req.user.role === 'employee' &&
      assignment.employee.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    assignment.status = status;
    assignment.completedAt = status === 'completed' ? new Date() : null;

    const updated = await assignment.save();
    await updated.populate([
      { path: 'employee', select: 'name email' },
      { path: 'training', select: 'title category' },
    ]);

    res.status(200).json({ message: 'Status updated successfully.', assignment: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Delete an assignment
// @route   DELETE /api/assignments/:id
// @access  Private (admin only)
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    res.status(200).json({ message: 'Assignment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Get progress summary for all employees (admin only)
// @route   GET /api/assignments/progress
// @access  Private (admin only)
const getProgressSummary = async (req, res) => {
  try {
    const summary = await Assignment.aggregate([
      {
        $group: {
          _id: '$employee',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          in_progress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
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
          employee: { name: 1, email: 1 },
          total: 1,
          completed: 1,
          in_progress: 1,
          pending: 1,
          completionRate: {
            $concat: [
              {
                $toString: {
                  $round: [
                    { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
                    1,
                  ],
                },
              },
              '%',
            ],
          },
        },
      },
      { $sort: { 'employee.name': 1 } },
    ]);

    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = {
  assignTraining,
  getAllAssignments,
  getAssignmentById,
  updateAssignmentStatus,
  deleteAssignment,
  getProgressSummary,
};
