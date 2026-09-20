import { z } from 'zod';

export const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Employee name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
