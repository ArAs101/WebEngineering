import type { FastifyPluginAsync } from 'fastify';
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
  app.get<{ Params: BearParams }>('/api/bears/:id', async (request, reply) => {
    const parsedId = BearId.safeParse(request.params.id);

    if (!parsedId.success) {
      return await reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid bear ID',
      });
    }

    const bears = await getBears();

    const bear = bears.find((candidate) => candidate.id === parsedId.data);

    if (bear === undefined) {
      return await reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Bear not found',
      });
    }

    return bear;
  });
};
