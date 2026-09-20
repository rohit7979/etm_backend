import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { CreateEmployeeInput, UpdateEmployeeInput } from '../validators/employee.validator';

export class EmployeeService {
  static async listEmployees(companyId: string) {
    const employees = await User.find({
      companyId,
      role: 'EMPLOYEE',
    })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return employees;
  }

  static async getEmployeeById(companyId: string, employeeId: string) {
    // Strictly scoped to the company
    const employee = await User.findOne({
      _id: employeeId,
      companyId,
      role: 'EMPLOYEE',
    }).select('-passwordHash');

    if (!employee) {
      throw { statusCode: 404, message: 'Employee not found in your company.' };
    }

    return employee;
  }

  static async createEmployee(companyId: string, input: CreateEmployeeInput) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw { statusCode: 404, message: 'Company not found.' };
    }

    if (company.status !== 'active') {
      throw { statusCode: 400, message: 'Cannot add employee to an inactive company.' };
    }

    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw { statusCode: 400, message: 'A user with this email already exists.' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const employee = await User.create({
      companyId: company._id,
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      passwordHash,
      role: 'EMPLOYEE',
      status: 'active',
    });

    return {
      id: employee._id.toString(),
      companyId: employee.companyId?.toString(),
      name: employee.name,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      createdAt: employee.createdAt,
    };
  }

  static async updateEmployee(
    companyId: string,
    employeeId: string,
    input: UpdateEmployeeInput
  ) {
    // Strictly isolate updates to the company's own employees
    const employee = await User.findOne({
      _id: employeeId,
      companyId,
      role: 'EMPLOYEE',
    });

    if (!employee) {
      throw { statusCode: 404, message: 'Employee not found in your company.' };
    }

    if (input.name !== undefined) {
      employee.name = input.name.trim();
    }

    if (input.status !== undefined) {
      employee.status = input.status;
    }

    await employee.save();

    return {
      id: employee._id.toString(),
      companyId: employee.companyId?.toString(),
      name: employee.name,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      updatedAt: employee.updatedAt,
    };
  }
}
