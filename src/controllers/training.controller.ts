import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { TrainingService } from '../services/training.service';

export class TrainingController {
  static async listTrainings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const trainings = await TrainingService.listTrainings(companyId);
      return res.status(200).json({
        success: true,
        count: trainings.length,
        trainings,
        data: trainings,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTrainingById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const id = req.params.id as string;
      const training = await TrainingService.getTrainingById(companyId, id);
      return res.status(200).json({
        success: true,
        training,
        data: training,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTraining(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const userId = req.user!.id;
      const training = await TrainingService.createTraining(companyId, userId, req.body);
      return res.status(201).json({
        success: true,
        message: 'Training created successfully.',
        training,
        data: training,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTraining(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const id = req.params.id as string;
      const training = await TrainingService.updateTraining(companyId, id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Training updated successfully.',
        training,
        data: training,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTraining(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const id = req.params.id as string;
      await TrainingService.deleteTraining(companyId, id);
      return res.status(200).json({
        success: true,
        message: 'Training deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
