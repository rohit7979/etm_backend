import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ITraining extends Document {
  companyId: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  durationHours: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const trainingSchema = new Schema<ITraining>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Training title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Training description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    durationHours: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [0.5, 'Duration must be at least 0.5 hours'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying trainings per company
trainingSchema.index({ companyId: 1, createdAt: -1 });

export const Training: Model<ITraining> =
  mongoose.models.Training || mongoose.model<ITraining>('Training', trainingSchema);
