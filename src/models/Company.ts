import mongoose, { Document, Schema, Model } from 'mongoose';
import { Status } from '../types';

export interface ICompany extends Document {
  name: string;
  email: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Company email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export const Company: Model<ICompany> = mongoose.model<ICompany>('Company', companySchema);
