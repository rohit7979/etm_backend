import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { generateToken } from '../utils/token';
import { LoginInput, AcceptInviteInput, ForgotPasswordInput, ResetPasswordInput } from '../validators/auth.validator';
import { sendPasswordResetEmail } from './email.service';
import { env } from '../config/env';

export class AuthService {
  static async login(input: LoginInput) {
    const email = input.email.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password.' };
    }

    if (user.status === 'PENDING_INVITE') {
      throw {
        statusCode: 403,
        message: 'Your invitation is pending. Please check your email to accept the invitation and set your password.',
      };
    }

    if (user.status === 'DEACTIVATED' || user.status === 'inactive') {
      throw {
        statusCode: 403,
        message: 'Your account has been deactivated. Please contact your administrator.',
      };
    }

    if (!user.passwordHash) {
      throw {
        statusCode: 401,
        message: 'Password not set. Please accept your invitation first.',
      };
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid email or password.' };
    }

    let companyData: any = null;
    if (user.role !== 'SUPER_ADMIN' && user.companyId) {
      const company = await Company.findById(user.companyId);
      if (!company) {
        throw { statusCode: 404, message: 'Associated company not found.' };
      }
      if (company.status !== 'active') {
        throw {
          statusCode: 403,
          message: 'Your company account is inactive. Please contact ETM platform support.',
        };
      }
      companyData = {
        id: company._id.toString(),
        name: company.name,
        status: company.status,
      };
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: user.companyId ? user.companyId.toString() : null,
    });

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        company: companyData,
      },
    };
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId).populate('companyId', 'name email status');
    if (!user) {
      throw { statusCode: 404, message: 'User not found.' };
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      company: user.companyId,
    };
  }

  /**
   * Verify an invite token.
   */
  static async verifyInviteToken(rawToken: string) {
    if (!rawToken) {
      throw { statusCode: 400, message: 'Invitation token is required.' };
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      inviteToken: hashedToken,
      inviteTokenExpiry: { $gt: new Date() },
      status: 'PENDING_INVITE',
    }).populate('companyId', 'name');

    if (!user) {
      throw { statusCode: 400, message: 'Invitation token is invalid or has expired.' };
    }

    const company = user.companyId as any;

    return {
      email: user.email,
      name: user.name,
      role: user.role,
      companyName: company?.name || null,
    };
  }

  /**
   * Accept an invite and set user password.
   */
  static async acceptInvite(rawToken: string, input: AcceptInviteInput) {
    if (!rawToken) {
      throw { statusCode: 400, message: 'Invitation token is required.' };
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      inviteToken: hashedToken,
      inviteTokenExpiry: { $gt: new Date() },
      status: 'PENDING_INVITE',
    });

    if (!user) {
      throw { statusCode: 400, message: 'Invitation token is invalid or has expired.' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    user.passwordHash = passwordHash;
    user.status = 'ACTIVE';
    user.emailVerifiedAt = new Date();
    user.inviteToken = null;
    user.inviteTokenExpiry = null;
    await user.save();

    let companyData: any = null;
    if (user.companyId) {
      const company = await Company.findById(user.companyId);
      if (company) {
        companyData = {
          id: company._id.toString(),
          name: company.name,
          status: company.status,
        };
      }
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: user.companyId ? user.companyId.toString() : null,
    });

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        company: companyData,
      },
      message: 'Account activated and password set successfully.',
    };
  }

  /**
   * Request password reset email.
   */
  static async forgotPassword(input: ForgotPasswordInput) {
    const email = input.email.toLowerCase().trim();
    const user = await User.findOne({ email });

    // Only allow reset if user exists and is active
    if (user && (user.status === 'ACTIVE' || (user.status as string) === 'active')) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      // 1 hour expiry
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const resetLink = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail(user.email, resetLink, user.name);
    }

    // Always return generic response to avoid email enumeration
    return {
      message: 'If an account exists with this email address, a password reset link has been sent.',
    };
  }

  /**
   * Verify password reset token.
   */
  static async verifyResetToken(rawToken: string) {
    if (!rawToken) {
      throw { statusCode: 400, message: 'Password reset token is required.' };
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw { statusCode: 400, message: 'Password reset link is invalid or has expired.' };
    }

    return {
      valid: true,
      email: user.email,
    };
  }

  /**
   * Reset password with valid token.
   */
  static async resetPassword(rawToken: string, input: ResetPasswordInput) {
    if (!rawToken) {
      throw { statusCode: 400, message: 'Password reset token is required.' };
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw { statusCode: 400, message: 'Password reset link is invalid or has expired.' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    return {
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  }
}
