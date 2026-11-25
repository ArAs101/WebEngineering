import { randomUUID } from 'node:crypto';
import { STATUS_CODES } from 'node:http';
import Fastify, { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LimitsSchema, type ApiLimits } from './env.js';
import { EmptyQuerySchema, registerSecurity } from './security.js';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler,
} from '@fastify/type-provider-zod';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import {
  AppError,
  DatabaseUnavailableError,
  ValidationError,
} from './errors.js';
import { bearRoutes } from './routes/bears.js';
import { commentRoutes } from './routes/comments.js';
import type { BearRepository } from './repositories/bear-repository.js';
import type { CommentRepository } from './repositories/comment-repository.js';
import type { Problem } from './schemas/problem.js';
import { HealthSchema } from './schemas/health.js';
import { ProblemSchema } from './schemas/problem.js';
import type { ReportComment } from './services/report-comment.js';
import { authRoutes } from './routes/auth.js';
import type { UserRepository } from './repositories/user-repository.js';
import cookie from '@fastify/cookie';
import sessionPlugin, { type SessionStore } from '@fastify/session';
import {
  sessionCookieName,
  sessionCookieOptions,
  sessionLifetimeMs,
} from './services/session.js';

const RequestIdSchema = z.uuid();
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

  if (statusCode === 413 || statusCode === 429) {
    const tooLarge = statusCode === 413;
    return {
      type: `${PROBLEM_BASE_URI}/${tooLarge ? 'body-too-large' : 'rate-limit'}`,
      title: tooLarge ? 'Payload Too Large' : 'Too Many Requests',
      status: statusCode,
      detail: tooLarge
        ? 'The request body exceeds the allowed size.'
        : 'Try again after the interval in Retry-After.',
      instance,
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

interface AppOptions {
  bears: BearRepository;
  comments: CommentRepository;
  session: { secret: string; secure: boolean; store: SessionStore };
  trustedProxyIp?: string;
  users: UserRepository;
  reportComment: ReportComment;
  checkDatabase: () => Promise<void>;
  closeDatabase?: () => Promise<void>;
  appVersion?: string;
  corsOrigins?: string[];
  limits?: ApiLimits;
  logger?: boolean;
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const limits = options.limits ?? LimitsSchema.parse({});
  const app = Fastify({
    bodyLimit: limits.BODY_LIMIT_BYTES,
    logger: options.logger ?? true,
    trustProxy: options.trustedProxyIp ?? false,
    requestIdHeader: false,
    genReqId: (request) => {
      const id = RequestIdSchema.safeParse(request.headers['x-request-id']);
      return id.success ? id.data : randomUUID();
    },
  });

  app.addHook('onClose', async () => {
    await options.closeDatabase?.();
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

  await registerSecurity(
    app,
    options.corsOrigins ?? [],
    options.session.secure,
    limits
  );

  await app.register(cookie);
  await app.register(sessionPlugin, {
    secret: options.session.secret,
    store: options.session.store,
    cookieName: sessionCookieName,
    cookie: {
      ...sessionCookieOptions(options.session.secure),
      maxAge: sessionLifetimeMs,
    },
    saveUninitialized: false,
    rolling: false,
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
        {
          name: 'Auth',
          description: 'User registration',
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
        spec.paths?.['/health/ready']?.get?.responses,
        spec.paths?.['/api/bears']?.get?.responses,
        spec.paths?.['/api/bears/{id}']?.get?.responses,
        spec.paths?.['/api/bears/{id}/comments']?.get?.responses,
        spec.paths?.['/api/bears/{id}/comments']?.post?.responses,
        spec.paths?.['/api/comments/{commentId}']?.delete?.responses,
        spec.paths?.['/api/comments/{commentId}/report']?.post?.responses,
        spec.paths?.['/api/auth/register']?.post?.responses,
        spec.paths?.['/api/auth/login']?.post?.responses,
        spec.paths?.['/api/auth/logout']?.post?.responses,
        spec.paths?.['/api/auth/me']?.get?.responses,
      ];

      for (const responses of responseGroups) {
        for (const status of [
          '400',
          '401',
          '403',
          '404',
          '409',
          '413',
          '429',
          '500',
          '503',
        ]) {
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

      for (const path of ['/api/auth/login', '/api/auth/register']) {
        const limited = spec.paths?.[path]?.post?.responses?.['429'];
        if (limited !== undefined && !('$ref' in limited)) {
          limited.headers = {
            ...limited.headers,
            'Retry-After': {
              description: 'Seconds until the next request can be accepted.',
              schema: { type: 'integer', minimum: 1 },
            },
          };
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

      const logoutResponse =
        spec.paths?.['/api/auth/logout']?.post?.responses?.['204'];
      if (logoutResponse !== undefined && !('$ref' in logoutResponse)) {
        logoutResponse.description = 'Logged out';
        delete logoutResponse.content;
      }

      return spec;
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
    staticCSP: true,
    transformStaticCSP: (header) =>
      options.session.secure
        ? header
        : header.replace('upgrade-insecure-requests;', ''),
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
        querystring: EmptyQuerySchema,
        tags: ['Health'],
        summary: 'Get API health status',
        description:
          'Returns the API status, application version, and process uptime in seconds.',
        response: {
          200: HealthSchema,
          400: ProblemSchema,
          500: ProblemSchema,
        },
        queryString: EmptyQuerySchema,
      },
    },
    async () => ({
      status: 'ok' as const,
      version: options.appVersion ?? 'dev',
      uptime: Math.round(process.uptime()),
    })
  );

  typedApp.get(
    '/health/ready',
    {
      schema: {
        tags: ['Health'],
        summary: 'Check database readiness',
        response: {
          200: HealthSchema,
          400: ProblemSchema,
          503: ProblemSchema,
        },
        queryString: EmptyQuerySchema,
      },
    },
    async () => {
      try {
        await options.checkDatabase();
      } catch (error: unknown) {
        throw new DatabaseUnavailableError({ cause: error });
      }

      return {
        status: 'ok' as const,
        version: options.appVersion ?? 'dev',
        uptime: Math.round(process.uptime()),
      };
    }
  );

  await app.register(authRoutes, {
    users: options.users,
    secureCookie: options.session.secure,
  });
  await app.register(bearRoutes, { bears: options.bears });
  await app.register(commentRoutes, {
    bears: options.bears,
    comments: options.comments,
    reportComment: options.reportComment,
    users: options.users,
  });
  return await app;
}
