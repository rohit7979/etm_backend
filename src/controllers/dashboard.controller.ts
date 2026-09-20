import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const stats = await DashboardService.getAdminDashboard(companyId);
      return res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const analytics = await DashboardService.getAdminAnalytics(companyId);
      return res.status(200).json(analytics);
    } catch (error) {
      next(error);
    }
  }

  static async getEmployees(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const result = await DashboardService.getEnrichedEmployees(companyId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
