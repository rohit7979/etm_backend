import { Types } from 'mongoose';
import { Training } from '../models/Training';
import { Assignment } from '../models/Assignment';
import { CreateTrainingInput, UpdateTrainingInput } from '../validators/training.validator';

export class TrainingService {
  static async listTrainings(companyId: string) {
    const trainings = await Training.find({ companyId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return trainings;
  }

  static async getTrainingById(companyId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw { statusCode: 400, message: 'Invalid training ID format' };
    }

    const training = await Training.findOne({ _id: id, companyId }).populate(
      'createdBy',
      'name email'
    );

    if (!training) {
      throw { statusCode: 404, message: 'Training not found in your company.' };
    }

    return training;
  }

  static async createTraining(companyId: string, userId: string, input: CreateTrainingInput) {
    const training = await Training.create({
      companyId,
      createdBy: userId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      durationHours: input.durationHours,
    });

    const populated = await training.populate('createdBy', 'name email');
    return populated;
  }

  static async updateTraining(companyId: string, id: string, input: UpdateTrainingInput) {
    if (!Types.ObjectId.isValid(id)) {
      throw { statusCode: 400, message: 'Invalid training ID format' };
    }

    const training = await Training.findOne({ _id: id, companyId });
    if (!training) {
      throw { statusCode: 404, message: 'Training not found in your company.' };
    }

    if (input.title !== undefined) training.title = input.title.trim();
    if (input.description !== undefined) training.description = input.description.trim();
    if (input.category !== undefined) training.category = input.category.trim();
    if (input.durationHours !== undefined) training.durationHours = input.durationHours;

    await training.save();
    const populated = await training.populate('createdBy', 'name email');
    return populated;
  }

  static async deleteTraining(companyId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw { statusCode: 400, message: 'Invalid training ID format' };
    }

    const training = await Training.findOneAndDelete({ _id: id, companyId });
    if (!training) {
      throw { statusCode: 404, message: 'Training not found in your company.' };
    }

    // Cascade delete any assignments tied to this training
    await Assignment.deleteMany({ training: id, companyId });

    return { id };
  }
}
