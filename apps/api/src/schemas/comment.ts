import { z } from 'zod';
import { BearId } from './bear.js';

export const NewCommentSchema = z.object({
  author: z.string().trim().min(1).max(80),
  text: z.string().trim().min(1).max(2000),
});

export const CommentSchema = NewCommentSchema.extend({
  id: z.uuid(),
  bearId: BearId,
  createdAt: z.iso.datetime(),
});

export type NewComment = z.infer<typeof NewCommentSchema>;
export type Comment = z.infer<typeof CommentSchema>;
