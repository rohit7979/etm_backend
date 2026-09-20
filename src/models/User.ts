import mongoose, { Schema, Model, Types, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, Status } from '../types';

export interface IUser {
  _id: Types.ObjectId;
  companyId?: Types.ObjectId | null;
  name: string;
  email: string;
  passwordHash?: string | null;
  role: UserRole;
  status: Status;
  inviteToken?: string | null;
  inviteTokenExpiry?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordExpiry?: Date | null;
  emailVerifiedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'EMPLOYEE'],
      required: [true, 'Role is required'],
    },
    status: {
      type: String,
      enum: ['PENDING_INVITE', 'ACTIVE', 'DEACTIVATED', 'active', 'inactive'],
      default: 'PENDING_INVITE',
    },
    inviteToken: {
      type: String,
      default: null,
      index: true,
    },
    inviteTokenExpiry: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      index: true,
    },
    resetPasswordExpiry: {
      type: Date,
      default: null,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce companyId requirement for tenant roles
userSchema.pre('validate', function () {
  if ((this.role === 'COMPANY_ADMIN' || this.role === 'EMPLOYEE') && !this.companyId) {
    this.invalidate('companyId', 'companyId is required for COMPANY_ADMIN and EMPLOYEE roles.');
  }
});

// Method to verify password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser, UserModel>('User', userSchema);
export type UserDocument = Document<unknown, {}, IUser> & IUser & IUserMethods;
