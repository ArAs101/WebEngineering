import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '../errors.js';
import { BearId, BearSchema } from '../schemas/bear.js';
import type { BearRepository } from '../repositories/bear-repository.js';
import { ProblemSchema } from '../schemas/problem.js';
import { EmptyQuerySchema } from '../security.js';

export const bearRoutes: FastifyPluginAsync<{ bears: BearRepository }> = async (
  app,
  { bears }
) => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  // GET /api/bears
  typedApp.get(
    '/api/bears',
    {
      schema: {
        tags: ['Bears'],
        summary: 'List bears',
        description:
          'Returns the stored bear species, optionally filtered by name.',
        querystring: z.strictObject({
          q: z.string().trim().max(100).optional(),
        }),
        response: {
          200: BearSchema.array(),
          400: ProblemSchema,
          500: ProblemSchema,
        },
      },
    },
    async (request) => {
      return await bears.list(request.query.q);
    }
  );

  // GET /api/bears/:id
  typedApp.get(
    '/api/bears/:id',
    {
      schema: {
        tags: ['Bears'],
        summary: 'Get a bear by ID',
        description: 'Returns a single bear identified by its species ID.',
        querystring: EmptyQuerySchema,
        params: z.strictObject({
          id: z
            .string()
            .describe(
              'Normalized species ID, e.g. ursus-arctos. Lowercase words separated by hyphens.'
            ),
        }),
        response: {
          200: BearSchema,
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
          })),
          'Invalid bear ID.'
        );
      }

      const bear = await bears.findById(parsedId.data);

      if (bear === null) {
        throw new NotFoundError('Bear');
      }

      return bear;
    }
  );
};
