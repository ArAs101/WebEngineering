import { z } from 'zod';

export const ValidationIssueSchema = z.object({
  path: z.string(),
  message: z.string(),
});

export const ProblemSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  status: z.number().int().min(400).max(599),
  detail: z.string(),
  instance: z.string().min(1),
  errors: z.array(ValidationIssueSchema).optional(),
});

z.globalRegistry.add(ProblemSchema, {
  id: 'Problem',
});

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type Problem = z.infer<typeof ProblemSchema>;
