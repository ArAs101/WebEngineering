import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import { NotFoundError, ValidationError } from '../errors.js';
import { BearId } from '../schemas/bear.js';
import { CommentSchema, NewCommentSchema } from '../schemas/comment.js';
import type { BearRepository } from '../repositories/bear-repository.js';
import type { CommentRepository } from '../repositories/comment-repository.js';
import { ProblemSchema } from '../schemas/problem.js';
import {
  CommentsQuerySchema,
  encodeCommentCursor,
} from '../schemas/comment-pagination.js';
import { CommentReportStatusSchema } from '../schemas/comment-report.js';
import type { ReportComment } from '../services/report-comment.js';

interface CommentRoutesOptions {
  bears: BearRepository;
  comments: CommentRepository;
  reportComment: ReportComment;
}

export const commentRoutes: FastifyPluginAsync<CommentRoutesOptions> = async (
  app,
  { bears, comments, reportComment }
) => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET /api/bears/:id/comments
  typedApp.get(
    '/api/bears/:id/comments',
    {
      schema: {
        tags: ['Comments'],
        summary: 'List comments for a bear',
        description:
          'Returns a page of comments for an existing bear, newest first.',
        querystring: CommentsQuerySchema,
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

      if ((await bears.findById(parsedId.data)) === null) {
        throw new NotFoundError('Bear');
      }

      const { limit, cursor } = request.query;
      const rows = await comments.listPage(parsedId.data, limit + 1, cursor);
      const items = rows.slice(0, limit);

      return {
        items,
        nextCursor:
          rows.length > limit
            ? encodeCommentCursor(items[items.length - 1])
            : null,
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

      if ((await bears.findById(parsedId.data)) === null) {
        throw new NotFoundError('Bear');
      }

      const comment = await comments.create(parsedId.data, parsedBody.data);

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

      if (!(await comments.remove(parsedId.data))) {
        throw new NotFoundError('Comment');
      }

      return await reply.code(204).send();
    }
  );

  typedApp.post(
    '/api/comments/:commentId/report',
    {
      schema: {
        tags: ['Comments'],
        summary: 'Report an existing comment',
        params: z.object({ commentId: z.uuid() }),
        response: {
          200: CommentReportStatusSchema,
          400: ProblemSchema,
          404: ProblemSchema,
          500: ProblemSchema,
        },
      },
    },
    async (request) => await reportComment(request.params.commentId)
  );
};
