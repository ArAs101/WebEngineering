import { z } from 'zod';

export const CommentReportStatusSchema = z.object({
  id: z.uuid(),
  reportCount: z.number().int().nonnegative(),
  hiddenAt: z.iso.datetime().nullable(),
});

export type CommentReportStatus = z.infer<typeof CommentReportStatusSchema>;
