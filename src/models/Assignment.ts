import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed';

export interface IAssignment extends Document {
  companyId: Types.ObjectId;
  employee: Types.ObjectId;
  training: Types.ObjectId;
  assignedBy: Types.ObjectId;
  status: AssignmentStatus;
  dueDate?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
      index: true,
    },
    training: {
      type: Schema.Types.ObjectId,
      ref: 'Training',
      required: [true, 'Training ID is required'],
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned by user ID is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same training from being assigned to the same employee within the company twice
assignmentSchema.index({ companyId: 1, employee: 1, training: 1 }, { unique: true });
assignmentSchema.index({ companyId: 1, status: 1 });
assignmentSchema.index({ companyId: 1, createdAt: -1 });

export const Assignment: Model<IAssignment> =
  mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', assignmentSchema);
