import * as argon2 from 'argon2';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import { EmailAlreadyRegisteredError } from '../errors.js';
import type { UserRepository } from '../repositories/user-repository.js';
import { PublicUserSchema, RegisterBodySchema } from '../schemas/auth.js';
import { ProblemSchema } from '../schemas/problem.js';

export const authRoutes: FastifyPluginAsync<{ users: UserRepository }> = async (
  app,
  { users }
) => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  typedApp.post(
    '/api/auth/register',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Register a user',
        body: RegisterBodySchema,
        response: {
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
};
