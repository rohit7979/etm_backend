import { z } from 'zod';

export const createAssignmentSchema = z.object({
  employeeId: z.string().min(1, 'Please select an employee'),
  trainingId: z.string().min(1, 'Please select a training'),
  dueDate: z.string().optional().nullable(),
});

export const updateAssignmentStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed'] as const),
});

export const addCommentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters'),
  replyTo: z.string().optional().nullable(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentStatusInput = z.infer<typeof updateAssignmentStatusSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
