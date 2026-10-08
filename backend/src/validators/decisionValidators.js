import { z } from 'zod';

export const criterionSchema = z.object({
  name: z.string().trim().min(1, 'Criterion name is required'),
  weight: z.number().min(0.01, 'Weight must be greater than 0').max(100, 'Weight cannot exceed 100'),
  direction: z.enum(['HIGHER_IS_BETTER', 'LOWER_IS_BETTER'], {
    errorMap: () => ({ message: 'Direction must be either HIGHER_IS_BETTER or LOWER_IS_BETTER' })
  }),
  description: z.string().optional()
});

export const alternativeSchema = z.object({
  name: z.string().trim().min(1, 'Alternative name is required'),
  description: z.string().optional()
});

export const createDecisionSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  question: z.string().trim().min(5, 'Decision question must be at least 5 characters'),
  description: z.string().optional(),
  criteria: z.array(criterionSchema).min(1, 'At least one criterion is required'),
  alternatives: z.array(alternativeSchema).min(2, 'At least two alternatives are required')
}).refine(
  (data) => {
    const totalWeight = data.criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
    return Math.abs(totalWeight - 100) < 0.01;
  },
  {
    message: 'Total criterion weight must equal exactly 100%',
    path: ['criteria']
  }
);

export const analyzeDecisionSchema = z.object({
  rawScores: z.record(z.string(), z.record(z.string(), z.number())).optional(),
  includeAiInterpretation: z.boolean().optional().default(true),
  forceAiRefresh: z.boolean().optional().default(false)
});
