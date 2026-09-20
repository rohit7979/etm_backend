import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AssignmentService } from '../services/assignment.service';

export class AssignmentController {
  static async listAssignments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const user = req.user!;
      const assignments = await AssignmentService.listAssignments(companyId, user);
      return res.status(200).json({
        success: true,
        count: assignments.length,
        assignments,
        data: assignments,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAssignmentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const user = req.user!;
      const id = req.params.id as string;
      const assignment = await AssignmentService.getAssignmentById(companyId, user, id);
      return res.status(200).json({
        success: true,
        assignment,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const userId = req.user!.id;
      const assignment = await AssignmentService.createAssignment(companyId, userId, req.body);
      return res.status(201).json({
        success: true,
        message: 'Training assigned successfully.',
        assignment,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const user = req.user!;
      const id = req.params.id as string;
      const { status } = req.body;
      const assignment = await AssignmentService.updateStatus(companyId, user, id, status);
      return res.status(200).json({
        success: true,
        message: 'Status updated successfully.',
        assignment,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const id = req.params.id as string;
      await AssignmentService.deleteAssignment(companyId, id);
      return res.status(200).json({
        success: true,
        message: 'Assignment deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProgressSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const summary = await AssignmentService.getProgressSummary(companyId);
      return res.status(200).json({
        success: true,
        summary,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const userId = req.user!.id;
      const stats = await AssignmentService.getMyStats(companyId, userId);
      return res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  // Comments
  static async getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const id = req.params.id as string;
      const comments = await AssignmentService.getComments(companyId, id);
      return res.status(200).json({
        success: true,
        count: comments.length,
        comments,
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const userId = req.user!.id;
      const id = req.params.id as string;
      const comment = await AssignmentService.addComment(companyId, id, userId, req.body);
      return res.status(201).json({
        success: true,
        message: 'Comment added.',
        comment,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const commentId = req.params.commentId as string;
      await AssignmentService.deleteComment(companyId, commentId, userId, userRole);
      return res.status(200).json({
        success: true,
        message: 'Comment deleted.',
      });
    } catch (error) {
      next(error);
    }
  }
}
