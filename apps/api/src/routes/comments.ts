import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import { NotFoundError, ValidationError } from '../errors.js';
import { BearId } from '../schemas/bear.js';
import { CommentSchema, NewCommentSchema } from '../schemas/comment.js';
import { getBears } from '../services/bear-service.js';
import { createCommentService } from '../services/comment-service.js';
import { ProblemSchema } from '../schemas/problem.js';

async function bearExists(bearId: string): Promise<boolean> {
  const bears = await getBears();
  return bears.some((bear) => bear.id === bearId);
}

export const commentRoutes: FastifyPluginAsync = async (app) => {
  const comments = createCommentService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET /api/bears/:id/comments
  typedApp.get(
    '/api/bears/:id/comments',
    {
      schema: {
        tags: ['Comments'],
        summary: 'List comments for a bear',
        description:
          'Returns all currently stored comments for an existing bear.',
        params: z.object({
          id: z
            .string()
            .describe('Normalized bear species ID, e.g. ursus-arctos'),
        }),
        response: {
          200: z.object({
            items: CommentSchema.array(),
            nextCursor: z.string().nullable(),
          }),
          400: ProblemSchema,
          404: ProblemSchema,
          500: ProblemSchema,
          502: ProblemSchema,
          504: ProblemSchema,
        },
      },
    },
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
  typedApp.post(
    '/api/bears/:id/comments',
    {
      attachValidation: true,
      schema: {
        tags: ['Comments'],
        summary: 'Create a comment for a bear',
        description: 'Creates a new comment for an existing bear.',
        params: z.object({
          id: z
            .string()
            .describe('Normalized bear species ID, e.g. ursus-arctos'),
        }),
        body: NewCommentSchema,
        response: {
          201: CommentSchema,
          400: ProblemSchema,
          404: ProblemSchema,
          500: ProblemSchema,
          502: ProblemSchema,
          504: ProblemSchema,
        },
      },
    },
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
  typedApp.delete(
    '/api/comments/:commentId',
    {
      schema: {
        tags: ['Comments'],
        summary: 'Delete a comment',
        description: 'Deletes an existing comment identified by its UUID.',
        params: z.object({
          commentId: z.string().describe('UUID of the comment to delete'),
        }),
        response: {
          204: z.undefined().describe('No Content'),
          400: ProblemSchema,
          404: ProblemSchema,
          500: ProblemSchema,
        },
      },
    },
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
