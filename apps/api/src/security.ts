import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiLimits } from './env.js';
import { ForbiddenError, ValidationError } from './errors.js';

export const EmptyQuerySchema = z.strictObject({});
const NoBodySchema = z.undefined();

export async function registerSecurity(
  app: FastifyInstance,
  origins: string[],
  secure: boolean,
  limits: ApiLimits
): Promise<void> {
  const allowedOrigins = new Set(origins);
  await app.register(helmet, {
    strictTransportSecurity: secure ? { maxAge: 31_536_000 } : false,
    contentSecurityPolicy: {
      directives: {
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        styleSrc: ["'self'"],
        upgradeInsecureRequests: secure ? [] : null,
      },
    },
  });
  await app.register(cors, {
    origin(origin, done) {
      if (origin === undefined) {
        done(null, false);
        return;
      }
      if (!allowedOrigins.has(origin)) {
        done(new ForbiddenError('Origin is not allowed.'), false);
        return;
      }
      done(null, true);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'DELETE'],
    allowedHeaders: ['content-type', 'x-request-id'],
    exposedHeaders: ['location', 'x-request-id', 'retry-after'],
    strictPreflight: true,
    maxAge: 600,
  });
  await app.register(rateLimit, {
    global: false,
    hook: 'onRequest',
    max: limits.AUTH_RATE_LIMIT_MAX,
    timeWindow: limits.AUTH_RATE_LIMIT_WINDOW_MS,
  });
  app.addHook('preValidation', (request, _reply, done) => {
    if (
      request.routeOptions.schema?.body === undefined &&
      (!NoBodySchema.safeParse(request.body).success ||
        Number(request.headers['content-length'] ?? 0) > 0 ||
        request.headers['transfer-encoding'] !== undefined)
    ) {
      done(
        new ValidationError([
          { path: 'body', message: 'This endpoint accepts no request body.' },
        ])
      );
      return;
    }
    done();
  });
}
