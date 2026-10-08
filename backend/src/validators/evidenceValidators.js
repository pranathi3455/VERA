import { z } from 'zod';

export const createEvidenceSchema = z.object({
  title: z.string().trim().min(2, 'Evidence title must be at least 2 characters'),
  source: z.string().trim().min(2, 'Source name/origin must be at least 2 characters'),
  sourceType: z.enum([
    'Research Paper',
    'Official Website',
    'Government Source',
    'Report',
    'Dataset',
    'User Provided',
    'Demo Evidence',
    'Other'
  ], {
    errorMap: () => ({ message: 'Invalid source type specified' })
  }),
  evidenceText: z.string().trim().min(5, 'Evidence text/excerpt must be at least 5 characters'),
  relevanceScore: z.number().min(1).max(100).optional().default(80),
  reliabilityScore: z.number().min(1).max(100).optional().default(80),
  supportingAlternative: z.string().trim().min(1, 'Target alternative name is required'),
  evidenceDirection: z.enum(['SUPPORTING', 'CONFLICTING', 'NEUTRAL'], {
    errorMap: () => ({ message: 'Direction must be SUPPORTING, CONFLICTING, or NEUTRAL' })
  })
});
