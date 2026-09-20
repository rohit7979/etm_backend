import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { CompanyService } from '../services/company.service';
import { ApiResponse } from '../utils/apiResponse';

export class CompanyController {
  static async createCompany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const company = await CompanyService.createCompany(req.body);
      return ApiResponse.success(res, 'Company created successfully', company, 201);
    } catch (error) {
      next(error);
    }
  }

  static async listCompanies(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companies = await CompanyService.listCompanies();
      return ApiResponse.success(res, 'Companies retrieved successfully', companies);
    } catch (error) {
      next(error);
    }
  }

  static async getCompanyById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.params.id as string;
      const company = await CompanyService.getCompanyById(companyId);
      return ApiResponse.success(res, 'Company retrieved successfully', company);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.params.id as string;
      const company = await CompanyService.updateStatus(companyId, req.body);
      return ApiResponse.success(res, 'Company status updated successfully', company);
    } catch (error) {
      next(error);
    }
  }

  static async createCompanyAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.params.id as string;
      const admin = await CompanyService.createCompanyAdmin(companyId, req.body);
      return ApiResponse.success(res, 'Company Admin provisioned successfully', admin, 201);
    } catch (error) {
      next(error);
    }
  }

  static async listCompanyAdmins(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.params.id as string;
      const admins = await CompanyService.listCompanyAdmins(companyId);
      return ApiResponse.success(res, 'Company Admins retrieved successfully', admins);
    } catch (error) {
      next(error);
    }
  }
}
