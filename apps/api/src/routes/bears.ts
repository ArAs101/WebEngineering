import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '../errors.js';
import { BearId, BearSchema } from '../schemas/bear.js';
import type { Database } from '../db/database.js';
import { getBearById, getBears } from '../services/bear-service.js';
import { ProblemSchema } from '../schemas/problem.js';

export const bearRoutes: FastifyPluginAsync<{ db: Database }> = async (
  app,
  { db }
) => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  // GET /api/bears
  typedApp.get(
    '/api/bears',
    {
      schema: {
        tags: ['Bears'],
        summary: 'List all bears',
        description: 'Returns the stored bear species.',
        response: {
          200: BearSchema.array(),
          500: ProblemSchema,
        },
      },
    },
    async () => {
      return await getBears(db);
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
        params: z.object({
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
          })),
          'Invalid bear ID.'
        );
      }

      const bear = await getBearById(db, parsedId.data);

      if (bear === null) {
        throw new NotFoundError('Bear');
      }

      return bear;
    }
  );
};
