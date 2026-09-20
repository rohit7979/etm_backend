import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { ApiResponse } from '../utils/apiResponse';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Unauthorized. Please log in.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        'Forbidden. You do not have permission to perform this action.',
        403
      );
    }

    next();
  };
};
