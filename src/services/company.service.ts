import crypto from 'crypto';
import { Company } from '../models/Company';
import { User } from '../models/User';
import {
  CreateCompanyInput,
  UpdateCompanyStatusInput,
  ProvisionCompanyAdminInput,
  CreateCompanyAdminInput,
} from '../validators/company.validator';
import { sendAdminInviteEmail } from './email.service';
import { env } from '../config/env';

export class CompanyService {
  static async createCompany(input: CreateCompanyInput) {
    const existing = await Company.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw { statusCode: 400, message: 'A company with this email already exists.' };
    }

    const company = await Company.create({
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      status: 'active',
    });

    return company;
  }

  static async listCompanies() {
    const companies = await Company.find().sort({ createdAt: -1 }).lean();

    // Enrich with counts of admins and employees for each company
    const enrichedCompanies = await Promise.all(
      companies.map(async (company) => {
        const [adminCount, employeeCount, pendingAdminCount] = await Promise.all([
          User.countDocuments({ companyId: company._id, role: 'COMPANY_ADMIN', status: { $in: ['ACTIVE', 'active'] } }),
          User.countDocuments({ companyId: company._id, role: 'EMPLOYEE' }),
          User.countDocuments({ companyId: company._id, role: 'COMPANY_ADMIN', status: 'PENDING_INVITE' }),
        ]);

        return {
          ...company,
          stats: {
            adminCount: adminCount + pendingAdminCount,
            activeAdminCount: adminCount,
            pendingAdminCount,
            employeeCount,
            totalUsers: adminCount + pendingAdminCount + employeeCount,
          },
        };
      })
    );

    return enrichedCompanies;
  }

  static async getCompanyById(id: string) {
    const company = await Company.findById(id);
    if (!company) {
      throw { statusCode: 404, message: 'Company not found.' };
    }
    return company;
  }

  static async updateStatus(id: string, input: UpdateCompanyStatusInput) {
    const company = await Company.findByIdAndUpdate(
      id,
      { status: input.status },
      { new: true, runValidators: true }
    );

    if (!company) {
      throw { statusCode: 404, message: 'Company not found.' };
    }

    return company;
  }

  static async provisionCompanyAdmin(companyId: string, input: ProvisionCompanyAdminInput) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw { statusCode: 404, message: 'Company not found.' };
    }

    if (company.status !== 'active') {
      throw { statusCode: 400, message: 'Cannot add admin to an inactive company.' };
    }

    const existingUser = await User.findOne({ email: input.email.toLowerCase().trim() });
    if (existingUser) {
      throw { statusCode: 400, message: 'A user with this email already exists.' };
    }

    // Generate secure 32-byte crypto token
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Store SHA-256 hash in database
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    // 48 hours expiry
    const inviteTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const admin = await User.create({
      companyId: company._id,
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      passwordHash: null,
      role: 'COMPANY_ADMIN',
      status: 'PENDING_INVITE',
      inviteToken: hashedToken,
      inviteTokenExpiry,
    });

    const inviteLink = `${env.FRONTEND_URL}/accept-invite?token=${rawToken}`;
    await sendAdminInviteEmail(admin.email, inviteLink, admin.name);

    return {
      id: admin._id.toString(),
      companyId: company._id.toString(),
      companyName: company.name,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      createdAt: admin.createdAt,
    };
  }

  // Alias for backward compatibility with existing route
  static async createCompanyAdmin(companyId: string, input: CreateCompanyAdminInput) {
    return this.provisionCompanyAdmin(companyId, input);
  }

  static async listCompanyAdmins(companyId: string) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw { statusCode: 404, message: 'Company not found.' };
    }

    const admins = await User.find({
      companyId: company._id,
      role: 'COMPANY_ADMIN',
    })
      .select('-passwordHash -inviteToken -resetPasswordToken')
      .sort({ createdAt: -1 });

    return admins;
  }
}
