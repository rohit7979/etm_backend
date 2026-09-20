import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AuthUserPayload } from '../types';
import { verifyToken } from '../utils/token';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { ApiResponse } from '../utils/apiResponse';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Primary: httpOnly cookie
    // 2. Fallback: Authorization: Bearer header (Postman / mobile / CLI)
    let token: string | undefined;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.error(res, 'Authentication token required.', 401);
    }

    let decoded: AuthUserPayload;

    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      return ApiResponse.error(res, 'Invalid or expired authentication token.', 401);
    }

    // Verify user exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      return ApiResponse.error(res, 'User no longer exists.', 401);
    }

    if (user.status !== 'ACTIVE' && (user.status as string) !== 'active') {
      return ApiResponse.error(res, 'Your account is not active. Please contact support.', 403);
    }

    // If tenant user, verify their company is active
    if (user.role !== 'SUPER_ADMIN' && user.companyId) {
      const company = await Company.findById(user.companyId);
      if (!company || company.status !== 'active') {
        return ApiResponse.error(res, 'Your company account is inactive. Please contact support.', 403);
      }
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: user.companyId ? user.companyId.toString() : null,
    };

    next();
  } catch (error: any) {
    next(error);
  }
};
