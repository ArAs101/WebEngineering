import { randomUUID } from 'node:crypto';
import { STATUS_CODES } from 'node:http';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler,
} from '@fastify/type-provider-zod';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import { AppError, ValidationError } from './errors.js';
import { bearRoutes } from './routes/bears.js';
import { commentRoutes } from './routes/comments.js';
import type { Problem } from './schemas/problem.js';
import { HealthSchema } from './schemas/health.js';
import { ProblemSchema } from './schemas/problem.js';

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

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

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

  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  await app.register(cors, {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['content-type', 'x-request-id'],
    exposedHeaders: ['location', 'x-request-id'],
    credentials: false,
    maxAge: 600,
  });

  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Bears API',
        description: 'Backend-for-Frontend API for bear data and comments.',
        version: '0.1.0',
      },
      tags: [
        {
          name: 'Health',
          description: 'API health and availability',
        },
        {
          name: 'Bears',
          description: 'Bear information provided by the BFF',
        },
        {
          name: 'Comments',
          description: 'Comments associated with bears',
        },
      ],
    },
    transform: jsonSchemaTransform,
    transformObject: (document) => {
      const spec = jsonSchemaTransformObject(document);

      if (!('openapi' in spec)) {
        return spec;
      }

      const responseGroups = [
        spec.paths?.['/health']?.get?.responses,
        spec.paths?.['/api/bears']?.get?.responses,
        spec.paths?.['/api/bears/{id}']?.get?.responses,
        spec.paths?.['/api/bears/{id}/comments']?.get?.responses,
        spec.paths?.['/api/bears/{id}/comments']?.post?.responses,
        spec.paths?.['/api/comments/{commentId}']?.delete?.responses,
      ];

      for (const responses of responseGroups) {
        for (const status of ['400', '404', '500', '502', '504']) {
          const response = responses?.[status];

          if (
            response === undefined ||
            !('content' in response) ||
            response.content === undefined
          ) {
            continue;
          }

          const jsonContent = response.content['application/json'];

          if (jsonContent !== undefined) {
            response.content['application/problem+json'] = jsonContent;
            delete response.content['application/json'];
          }
        }
      }

      const createdResponse =
        spec.paths?.['/api/bears/{id}/comments']?.post?.responses?.['201'];

      if (createdResponse !== undefined && !('$ref' in createdResponse)) {
        createdResponse.description = 'Comment created successfully';

        createdResponse.headers = {
          ...createdResponse.headers,
          Location: {
            description: 'Relative URL of the newly created comment.',
            schema: {
              type: 'string',
            },
            example: '/api/comments/123e4567-e89b-42d3-a456-426614174000',
          },
        };
      }

      const noContentResponse =
        spec.paths?.['/api/comments/{commentId}']?.delete?.responses?.['204'];

      if (noContentResponse !== undefined && !('$ref' in noContentResponse)) {
        noContentResponse.description = 'Comment deleted successfully';

        delete noContentResponse.content;
      }

      return spec;
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  typedApp.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Get API health status',
        description:
          'Returns the API status, application version, and process uptime in seconds.',
        response: {
          200: HealthSchema,
          500: ProblemSchema,
        },
      },
    },
    async () => ({
      status: 'ok' as const,
      version: process.env.APP_VERSION ?? 'dev',
      uptime: Math.round(process.uptime()),
    })
  );

  await app.register(bearRoutes);
  await app.register(commentRoutes);
  return await app;
}
