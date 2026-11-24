import { z } from 'zod';
import { BearId } from './bear.js';

export const NewCommentSchema = z.strictObject({
  author: z.string().trim().min(1).max(80),
  text: z.string().trim().min(1).max(2000),
});

export const CommentSchema = NewCommentSchema.extend({
  id: z.uuid(),
  authorId: z.uuid().nullable(),
  bearId: BearId,
  createdAt: z.iso.datetime(),
});

export const CommentViewSchema = CommentSchema.extend({
  canDelete: z.boolean(),
});

z.globalRegistry.add(NewCommentSchema, {
  id: 'NewComment',
});

z.globalRegistry.add(CommentSchema, {
  id: 'Comment',
});

export type CommentView = z.infer<typeof CommentViewSchema>;
export type NewComment = z.infer<typeof NewCommentSchema>;
export type Comment = z.infer<typeof CommentSchema>;
