import { Types } from 'mongoose';
import { Assignment, AssignmentStatus } from '../models/Assignment';
import { Training } from '../models/Training';
import { User } from '../models/User';
import { Comment } from '../models/Comment';
import { CreateAssignmentInput, AddCommentInput } from '../validators/assignment.validator';

export class AssignmentService {
  static async listAssignments(
    companyId: string,
    user: { id: string; role: string }
  ) {
    const filter: Record<string, any> = { companyId };

    if (user.role === 'EMPLOYEE') {
      filter.employee = user.id;
    }

    const assignments = await Assignment.find(filter)
      .populate('employee', 'name email status role')
      .populate('training', 'title category durationHours description')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    return assignments;
  }

  static async getAssignmentById(
    companyId: string,
    user: { id: string; role: string },
    id: string
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw { statusCode: 400, message: 'Invalid assignment ID format' };
    }

    const assignment = await Assignment.findOne({ _id: id, companyId })
      .populate('employee', 'name email status role')
      .populate('training', 'title category durationHours description')
      .populate('assignedBy', 'name email');

    if (!assignment) {
      throw { statusCode: 404, message: 'Assignment not found.' };
    }

    if (
      user.role === 'EMPLOYEE' &&
      assignment.employee._id.toString() !== user.id
    ) {
      throw { statusCode: 403, message: 'Access denied to this assignment.' };
    }

    return assignment;
  }

  static async createAssignment(
    companyId: string,
    assignedByUserId: string,
    input: CreateAssignmentInput
  ) {
    if (!Types.ObjectId.isValid(input.employeeId) || !Types.ObjectId.isValid(input.trainingId)) {
      throw { statusCode: 400, message: 'Invalid employee or training ID format' };
    }

    // Verify employee belongs to same company
    const employee = await User.findOne({
      _id: input.employeeId,
      companyId,
      role: 'EMPLOYEE',
    });

    if (!employee) {
      throw { statusCode: 404, message: 'Employee not found in your company.' };
    }

    // Verify training belongs to same company
    const training = await Training.findOne({
      _id: input.trainingId,
      companyId,
    });

    if (!training) {
      throw { statusCode: 404, message: 'Training not found in your company.' };
    }

    // Check duplicate assignment
    const existing = await Assignment.findOne({
      companyId,
      employee: input.employeeId,
      training: input.trainingId,
    });

    if (existing) {
      throw {
        statusCode: 400,
        message: 'This training has already been assigned to this employee.',
      };
    }

    const assignment = await Assignment.create({
      companyId,
      employee: input.employeeId,
      training: input.trainingId,
      assignedBy: assignedByUserId,
      status: 'pending',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    });

    const populated = await assignment.populate([
      { path: 'employee', select: 'name email status role' },
      { path: 'training', select: 'title category durationHours description' },
      { path: 'assignedBy', select: 'name email' },
    ]);

    return populated;
  }

  static async updateStatus(
    companyId: string,
    user: { id: string; role: string },
    id: string,
    status: AssignmentStatus
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw { statusCode: 400, message: 'Invalid assignment ID format' };
    }

    const assignment = await Assignment.findOne({ _id: id, companyId });
    if (!assignment) {
      throw { statusCode: 404, message: 'Assignment not found.' };
    }

    if (
      user.role === 'EMPLOYEE' &&
      assignment.employee.toString() !== user.id
    ) {
      throw { statusCode: 403, message: 'Access denied.' };
    }

    assignment.status = status;
    if (status === 'completed') {
      assignment.completedAt = new Date();
    } else {
      assignment.completedAt = null;
    }

    await assignment.save();

    const populated = await assignment.populate([
      { path: 'employee', select: 'name email status role' },
      { path: 'training', select: 'title category durationHours description' },
      { path: 'assignedBy', select: 'name email' },
    ]);

    return populated;
  }

  static async deleteAssignment(companyId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw { statusCode: 400, message: 'Invalid assignment ID format' };
    }

    const assignment = await Assignment.findOneAndDelete({ _id: id, companyId });
    if (!assignment) {
      throw { statusCode: 404, message: 'Assignment not found.' };
    }

    await Comment.deleteMany({ assignment: id, companyId });
    return { id };
  }

  static async getProgressSummary(companyId: string) {
    const employees = await User.find({ companyId, role: 'EMPLOYEE' })
      .select('name email')
      .sort({ name: 1 });

    const summary = await Promise.all(
      employees.map(async (emp) => {
        const [total, completed, inProgress, pending] = await Promise.all([
          Assignment.countDocuments({ companyId, employee: emp._id }),
          Assignment.countDocuments({ companyId, employee: emp._id, status: 'completed' }),
          Assignment.countDocuments({ companyId, employee: emp._id, status: 'in_progress' }),
          Assignment.countDocuments({ companyId, employee: emp._id, status: 'pending' }),
        ]);

        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          employee: { name: emp.name, email: emp.email },
          total,
          completed,
          in_progress: inProgress,
          pending,
          completionRate: `${rate}%`,
        };
      })
    );

    return summary;
  }

  static async getMyStats(companyId: string, userId: string) {
    const [total, completed, inProgress, pending, recentAssignments] = await Promise.all([
      Assignment.countDocuments({ companyId, employee: userId }),
      Assignment.countDocuments({ companyId, employee: userId, status: 'completed' }),
      Assignment.countDocuments({ companyId, employee: userId, status: 'in_progress' }),
      Assignment.countDocuments({ companyId, employee: userId, status: 'pending' }),
      Assignment.find({ companyId, employee: userId })
        .populate('training', 'title category durationHours description')
        .populate('assignedBy', 'name email')
        .sort({ updatedAt: -1 })
        .limit(5),
    ]);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate,
      recentAssignments,
    };
  }

  // Comments
  static async getComments(companyId: string, assignmentId: string) {
    const comments = await Comment.find({ companyId, assignment: assignmentId })
      .populate('author', 'name email role')
      .populate('replyTo', 'text')
      .sort({ createdAt: 1 });

    return comments;
  }

  static async addComment(
    companyId: string,
    assignmentId: string,
    authorId: string,
    input: AddCommentInput
  ) {
    const assignment = await Assignment.findOne({ _id: assignmentId, companyId });
    if (!assignment) {
      throw { statusCode: 404, message: 'Assignment not found.' };
    }

    const comment = await Comment.create({
      companyId,
      assignment: assignmentId,
      author: authorId,
      text: input.text.trim(),
      replyTo: input.replyTo || null,
    });

    const populated = await comment.populate([
      { path: 'author', select: 'name email role' },
      { path: 'replyTo', select: 'text' },
    ]);

    return populated;
  }

  static async deleteComment(
    companyId: string,
    commentId: string,
    userId: string,
    userRole: string
  ) {
    const comment = await Comment.findOne({ _id: commentId, companyId });
    if (!comment) {
      throw { statusCode: 404, message: 'Comment not found.' };
    }

    // Only the author or a COMPANY_ADMIN can delete the comment
    if (userRole !== 'COMPANY_ADMIN' && comment.author.toString() !== userId) {
      throw { statusCode: 403, message: 'Permission denied to delete this comment.' };
    }

    await Comment.findByIdAndDelete(commentId);
    return { id: commentId };
  }
}
