const Comment = require('../models/Comment');
const Assignment = require('../models/Assignment');

// @desc    Add a comment to an assignment
// @route   POST /api/assignments/:id/comments
// @access  Private (admin + employee who owns the assignment)
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    // Employees can only comment on their own assignments
    if (
      req.user.role === 'employee' &&
      assignment.employee.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const comment = await Comment.create({
      assignment: assignment._id,
      author: req.user._id,
      text: text.trim(),
    });

    await comment.populate('author', 'name email role');

    res.status(201).json({ message: 'Comment added successfully.', comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Get all comments for an assignment
// @route   GET /api/assignments/:id/comments
// @access  Private (admin + employee who owns the assignment)
const getComments = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    // Employees can only view comments on their own assignments
    if (
      req.user.role === 'employee' &&
      assignment.employee.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const comments = await Comment.find({ assignment: req.params.id })
      .populate('author', 'name email role')
      .sort({ createdAt: 1 });

    res.status(200).json({ count: comments.length, comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/assignments/:id/comments/:commentId
// @access  Private (author can delete own comment; admin can delete any)
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Only the author or admin can delete
    if (
      req.user.role !== 'admin' &&
      comment.author.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await comment.deleteOne();
    res.status(200).json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = { addComment, getComments, deleteComment };
