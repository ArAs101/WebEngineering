import { randomUUID } from 'node:crypto';
import { STATUS_CODES } from 'node:http';
import Fastify, { type FastifyInstance } from 'fastify';
import { AppError, ValidationError } from './errors.js';
import { bearRoutes } from './routes/bears.js';
import { commentRoutes } from './routes/comments.js';
import type { Problem } from './schemas/problem.js';

const PROBLEM_BASE_URI = 'https://bears.example/problems';

function toProblem(error: Error, requestId: string): Problem {
  const instance = `urn:uuid:${requestId}`;

  // Known application errors
  if (error instanceof AppError) {
    return {
      type: error.problemType,
      title: error.title,
      status: error.statusCode,
      detail: error.message,
      instance,
      ...(error instanceof ValidationError ? { errors: error.issues } : {}),
    };
  }

  // Status codes from Fastify's built-in errors
  const statusCode =
    'statusCode' in error && typeof error.statusCode === 'number'
      ? error.statusCode
      : 500;

  if (statusCode === 400) {
    return {
      type: `${PROBLEM_BASE_URI}/validation`,
      title: 'Invalid request',
      status: 400,
      detail: 'The request contains invalid data.',
      instance,
      errors: [
        {
          path: 'request',
          message: 'Invalid request data.',
        },
      ],
    };
  }

  if (statusCode >= 400 && statusCode < 500) {
    return {
      type: 'about:blank',
      title: STATUS_CODES[statusCode] ?? 'Client error',
      status: statusCode,
      detail: 'The request could not be processed.',
      instance,
    };
  }

  // Unexpected server errors: never expose internal details
  return {
    type: `${PROBLEM_BASE_URI}/internal`,
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected server error occurred.',
    instance,
  };
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  });

  // Include the request ID in every response
  app.addHook('onSend', async (request, reply) => {
    void reply.header('x-request-id', request.id);
  });

  // Central error handler
  app.setErrorHandler((error, request, reply) => {
    const normalizedError =
      error instanceof Error ? error : new Error('Unepected server error');
    const problem = toProblem(normalizedError, request.id);

    if (problem.status >= 500) {
      request.log.error({ err: error }, 'Request failed');
    } else {
      request.log.info({ err: error }, 'Request rejected');
    }

    return reply
      .code(problem.status)
      .type('application/problem+json')
      .send(problem);
  });

  // Handle unknown URLs
  app.setNotFoundHandler((request, reply) => {
    const problem: Problem = {
      type: `${PROBLEM_BASE_URI}/not-found`,
      title: 'Resource not found',
      status: 404,
      detail: 'No such route exists.',
      instance: `urn:uuid:${request.id}`,
    };

    request.log.info('Route not found');

    return reply.code(404).type('application/problem+json').send(problem);
  });

  app.get('/health', async () => ({
    status: 'ok',
    version: process.env.APP_VERSION ?? 'dev',
    uptime: Math.round(process.uptime()),
  }));

  await app.register(bearRoutes);
  await app.register(commentRoutes);
  return await app;
}
