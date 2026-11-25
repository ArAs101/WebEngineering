import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import * as argon2 from 'argon2';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import {
  AuthenticationError,
  EmailAlreadyRegisteredError,
  ValidationError,
} from '../errors.js';
import type { UserRepository } from '../repositories/user-repository.js';
import {
  LoginBodySchema,
  PublicUserSchema,
  RegisterBodySchema,
} from '../schemas/auth.js';
import { ProblemSchema } from '../schemas/problem.js';
import {
  sessionCookieName,
  sessionCookieOptions,
} from '../services/session.js';
import { EmptyQuerySchema } from '../security.js';

export const authRoutes: FastifyPluginAsync<{
  users: UserRepository;
  secureCookie: boolean;
}> = async (app, { users, secureCookie }) => {
  const dummyHash = await argon2.hash(randomBytes(32), {
    type: argon2.argon2id,
  });
  app.addHook('onRequest', (_request, reply, done) => {
    void reply.header('Cache-Control', 'no-store');
    done();
  });
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  typedApp.post(
    '/api/auth/register',
    {
      config: { rateLimit: {} },
      schema: {
        tags: ['Auth'],
        querystring: EmptyQuerySchema,
        summary: 'Register a user',
        body: RegisterBodySchema,
        response: {
          413: ProblemSchema,
          429: ProblemSchema,
          201: PublicUserSchema,
          400: ProblemSchema,
          409: ProblemSchema,
          500: ProblemSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
      });
      const user = await users.create(email, passwordHash);
      if (user === null) {
        throw new EmailAlreadyRegisteredError();
      }

      return await reply.code(201).send(user);
    }
  );

  typedApp.post(
    '/api/auth/login',
    {
      config: { rateLimit: {} },
      schema: {
        tags: ['Auth'],
        querystring: EmptyQuerySchema,
        summary: 'Log in',
        body: LoginBodySchema,
        response: {
          413: ProblemSchema,
          429: ProblemSchema,
          200: PublicUserSchema,
          400: ProblemSchema,
          401: ProblemSchema,
          500: ProblemSchema,
        },
      },
    },
    async (request, reply) => {
      if (secureCookie && request.protocol !== 'https') {
        throw new ValidationError(
          [{ path: 'request', message: 'HTTPS required.' }],
          'Use HTTPS to log in.'
        );
      }
      const { email, password } = request.body;
      const user = await users.findByEmail(email);
      const matches = await argon2.verify(
        user?.passwordHash ?? dummyHash,
        password
      );
      if (user === null || !matches) {
        throw new AuthenticationError('Invalid email or password.');
      }

      await request.session.regenerate();
      request.session.userId = user.id;
      return await reply.send({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    }
  );

  typedApp.get(
    '/api/auth/me',
    {
      schema: {
        tags: ['Auth'],
        querystring: EmptyQuerySchema,
        summary: 'Get the logged-in user',
        response: {
          400: ProblemSchema,
          200: PublicUserSchema,
          401: ProblemSchema,
          500: ProblemSchema,
        },
      },
    },
    async (request) => {
      const { userId } = request.session;
      const user = userId === undefined ? null : await users.findById(userId);
      if (user === null) {
        throw new AuthenticationError('Log in to continue.');
      }
      return user;
    }
  );

  typedApp.post(
    '/api/auth/logout',
    {
      schema: {
        tags: ['Auth'],
        querystring: EmptyQuerySchema,
        summary: 'Log out',
        response: {
          400: ProblemSchema,
          204: z.undefined().describe('No Content'),
          500: ProblemSchema,
        },
      },
    },
    async (request, reply) => {
      await request.session.destroy();
      void reply.clearCookie(
        sessionCookieName,
        sessionCookieOptions(secureCookie)
      );
      return await reply.code(204).send();
    }
  );
};
