import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '../errors.js';
import { BearId } from '../schemas/bear.js';
import { NewCommentSchema } from '../schemas/comment.js';
import { getBears } from '../services/bear-service.js';
import { createCommentService } from '../services/comment-service.js';

interface BearParams {
  id: string;
}

interface CommentParams {
  commentId: string;
}

async function bearExists(bearId: string): Promise<boolean> {
  const bears = await getBears();
  return bears.some((bear) => bear.id === bearId);
}

export const commentRoutes: FastifyPluginAsync = async (app) => {
  const comments = createCommentService();

  // GET /api/bears/:id/comments
  app.get<{ Params: BearParams }>(
    '/api/bears/:id/comments',
    async (request) => {
      const parsedId = BearId.safeParse(request.params.id);

      if (!parsedId.success) {
        throw new ValidationError(
          parsedId.error.issues.map((issue) => ({
            path: 'id',
            message: issue.message,
          }))
        );
      }

      if (!(await bearExists(parsedId.data))) {
        throw new NotFoundError('Bear');
      }

      return {
        items: comments.findByBearId(parsedId.data),
        nextCursor: null,
      };
    }
  );

  // POST /api/bears/:id/comments
  app.post<{ Params: BearParams }>(
    '/api/bears/:id/comments',
    async (request, reply) => {
      const parsedId = BearId.safeParse(request.params.id);
      const parsedBody = NewCommentSchema.safeParse(request.body);

      if (!parsedId.success || !parsedBody.success) {
        const issues = [
          ...(!parsedId.success
            ? parsedId.error.issues.map((issue) => ({
                path: 'id',
                message: issue.message,
              }))
            : []),
          ...(!parsedBody.success
            ? parsedBody.error.issues.map((issue) => ({
                path: issue.path.map(String).join('.'),
                message: issue.message,
              }))
            : []),
        ];

        throw new ValidationError(issues, 'The comment could not be accepted.');
      }

      if (!(await bearExists(parsedId.data))) {
        throw new NotFoundError('Bear');
      }

      const comment = comments.create(parsedId.data, parsedBody.data);

      return await reply
        .code(201)
        .header('Location', `/api/comments/${comment.id}`)
        .send(comment);
    }
  );

  // DELETE /api/comments/:commentId
  app.delete<{ Params: CommentParams }>(
    '/api/comments/:commentId',
    async (request, reply) => {
      const parsedId = z.uuid().safeParse(request.params.commentId);

      if (!parsedId.success) {
        throw new ValidationError(
          parsedId.error.issues.map((issue) => ({
            path: 'commentId',
            message: issue.message,
          }))
        );
      }

      if (!comments.remove(parsedId.data)) {
        throw new NotFoundError('Comment');
      }

      return await reply.code(204).send();
    }
  );
};
