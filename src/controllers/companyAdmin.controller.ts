import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { CompanyService } from '../services/company.service';
import { ApiResponse } from '../utils/apiResponse';

export class CompanyAdminController {
  static async provision(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.body.companyId || (req.params.companyId as string);
      if (!companyId) {
        return ApiResponse.error(res, 'companyId is required in request body or parameter.', 400);
      }

      const admin = await CompanyService.provisionCompanyAdmin(companyId, {
        companyId,
        name: req.body.name,
        email: req.body.email,
      });

      return ApiResponse.success(res, 'Company Admin provisioned and invitation sent successfully.', admin, 201);
    } catch (error) {
      next(error);
    }
  }
}
