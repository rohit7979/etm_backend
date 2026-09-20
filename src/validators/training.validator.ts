import { z } from 'zod';

export const createTrainingSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(60, 'Category cannot exceed 60 characters'),
  durationHours: z
    .number()
    .min(0.5, 'Duration must be at least 0.5 hours')
    .max(500, 'Duration cannot exceed 500 hours'),
});

export const updateTrainingSchema = createTrainingSchema.partial();

export type CreateTrainingInput = z.infer<typeof createTrainingSchema>;
export type UpdateTrainingInput = z.infer<typeof updateTrainingSchema>;
