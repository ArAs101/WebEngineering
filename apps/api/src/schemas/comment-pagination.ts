import { z } from 'zod';
import type { CommentCursor } from '../repositories/comment-repository.js';

const CursorSchema = z.object({
  createdAt: z.iso
    .datetime({ precision: 3 })
    .refine((value) => !value.startsWith('0000-')),
  id: z.uuid(),
});

export const CommentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z
    .string()
    .max(200)
    .regex(/^[A-Za-z0-9_-]+$/)
    .transform((encoded, context): unknown => {
      try {
        return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
      } catch {
        context.addIssue({
          code: 'custom',
          message: 'Invalid comment cursor.',
        });
        return z.NEVER;
      }
    })
    .pipe(CursorSchema)
    .optional(),
});

export function encodeCommentCursor({ createdAt, id }: CommentCursor): string {
  return Buffer.from(JSON.stringify({ createdAt, id })).toString('base64url');
}
