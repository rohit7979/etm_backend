import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Ensures the authenticated user has an assigned company context
 * and sets req.companyId from trusted token data, NEVER trusting client input.
 */
export const requireTenant = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return ApiResponse.error(res, 'Unauthorized.', 401);
  }

  // Super Admin is platform level, but if they enter a tenant route without company context:
  if (req.user.role === 'SUPER_ADMIN') {
    // If a super admin specifies a company context or passes through, handled explicitly in controllers
    return next();
  }

  if (!req.user.companyId) {
    return ApiResponse.error(res, 'No company context associated with this account.', 403);
  }

  req.companyId = req.user.companyId;
  next();
};
