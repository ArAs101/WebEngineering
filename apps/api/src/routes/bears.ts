import type { FastifyPluginAsync } from 'fastify';
import { NotFoundError, ValidationError } from '../errors.js';
import { BearId } from '../schemas/bear.js';
import { getBears } from '../services/bear-service.js';

interface BearParams {
  id: string;
}

export const bearRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/bears
  app.get('/api/bears', async () => {
    return await getBears();
  });

  // GET /api/bears/:id
  app.get<{ Params: BearParams }>('/api/bears/:id', async (request) => {
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

    const bears = await getBears();

    const bear = bears.find((candidate) => candidate.id === parsedId.data);

    if (bear === undefined) {
      throw new NotFoundError('Bear');
    }

    return bear;
  });
};
