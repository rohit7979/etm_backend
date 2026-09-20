import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { EmployeeService } from '../services/employee.service';
import { ApiResponse } from '../utils/apiResponse';

export class EmployeeController {
  static async listEmployees(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const employees = await EmployeeService.listEmployees(companyId);
      return ApiResponse.success(res, 'Employees retrieved successfully', employees);
    } catch (error) {
      next(error);
    }
  }

  static async getEmployeeById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const employeeId = req.params.id as string;
      const employee = await EmployeeService.getEmployeeById(companyId, employeeId);
      return ApiResponse.success(res, 'Employee retrieved successfully', employee);
    } catch (error) {
      next(error);
    }
  }

  static async createEmployee(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const employee = await EmployeeService.createEmployee(companyId, req.body);
      return ApiResponse.success(res, 'Employee created successfully', employee, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateEmployee(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const employeeId = req.params.id as string;
      const updated = await EmployeeService.updateEmployee(companyId, employeeId, req.body);
      return ApiResponse.success(res, 'Employee updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }
}
