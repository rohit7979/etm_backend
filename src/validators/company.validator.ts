import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Please enter a valid company email address'),
});

export const updateCompanyStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
});

export const provisionCompanyAdminSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required').optional(),
  name: z.string().min(2, 'Admin name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
});

// Backwards compatibility alias
export const createCompanyAdminSchema = provisionCompanyAdminSchema;

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyStatusInput = z.infer<typeof updateCompanyStatusSchema>;
export type ProvisionCompanyAdminInput = z.infer<typeof provisionCompanyAdminSchema>;
export type CreateCompanyAdminInput = ProvisionCompanyAdminInput;
