import { Request, Response, NextFunction, CookieOptions } from 'express';
import { AuthenticatedRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';

const getCookieOptions = (): CookieOptions => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};

export class AuthController {
  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.cookie('token', result.token, getCookieOptions());
      return ApiResponse.success(res, 'Login successful', { user: result.user });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.id);
      return ApiResponse.success(res, 'Profile retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });
    return ApiResponse.success(res, 'Logged out successfully');
  }

  static async verifyInviteToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token as string;
      const data = await AuthService.verifyInviteToken(token);
      return ApiResponse.success(res, 'Invitation token verified successfully', data);
    } catch (error) {
      next(error);
    }
  }

  static async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token as string;
      const result = await AuthService.acceptInvite(token, req.body);
      if (result.token) {
        res.cookie('token', result.token, getCookieOptions());
      }
      return ApiResponse.success(res, result.message, { user: result.user });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.forgotPassword(req.body);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async verifyResetToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token as string;
      const data = await AuthService.verifyResetToken(token);
      return ApiResponse.success(res, 'Password reset token is valid', data);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token as string;
      const result = await AuthService.resetPassword(token, req.body);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}
