import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
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
    async (request, reply) => {
      const parsedId = BearId.safeParse(request.params.id);

      if (!parsedId.success) {
        return await reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid bear ID',
        });
      }

      if (!(await bearExists(parsedId.data))) {
        return await reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Bear not found',
        });
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
        return await reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid comment data or bear ID',
        });
      }

      if (!(await bearExists(parsedId.data))) {
        return await reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Bear not found',
        });
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
        return await reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid comment ID',
        });
      }

      if (!comments.remove(parsedId.data)) {
        return await reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Comment not found',
        });
      }

      return await reply.code(204).send();
    }
  );
};
