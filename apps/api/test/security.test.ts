
import { expect, test } from 'vitest';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { MemoryStore } from '@fastify/session';
import { buildApp } from '../src/app.js';
import { BearSchema } from '../src/schemas/bear.js';
import { CommentViewSchema } from '../src/schemas/comment.js';
import { createReportComment } from '../src/services/report-comment.js';
import {
  createMemoryBearRepository,
  createMemoryCommentRepository,
  createMemoryUserRepository,
} from './memory-repositories.js';

const fixture = BearSchema.array().parse(
  JSON.parse(
    await readFile(new URL('../scripts/bears.json', import.meta.url), 'utf8')
  )
);

test(
  'IDOR attack: a user cannot delete another users comment',
  { timeout: 30_000 },
  async () => {
    const comments = createMemoryCommentRepository();

    const app = await buildApp({
      bears: createMemoryBearRepository(fixture),
      comments,
      users: createMemoryUserRepository(),
      session: {
        secret: randomBytes(32).toString('hex'),
        secure: false,
        store: new MemoryStore(),
      },
      reportComment: createReportComment((operation) => operation(comments)),
      checkDatabase: () => Promise.resolve(),
      logger: false,
    });

    try {
      // Register and authenticate a user.
      async function registerAndLogin(email: string): Promise<string> {
        const payload = {
          email,
          password: randomBytes(24).toString('hex'),
        };

        const registration = await app.inject({
          method: 'POST',
          url: '/api/auth/register',
          payload,
        });

        expect(registration.statusCode).toBe(201);

        const login = await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload,
        });

        expect(login.statusCode).toBe(200);
        expect(typeof login.headers['set-cookie']).toBe('string');

        return String(login.headers['set-cookie']).split(';')[0];
      }

      // Arrange: create two independent user sessions.
      const authorCookie = await registerAndLogin('author@example.test');
      const attackerCookie = await registerAndLogin('attacker@example.test');

      const path = '/api/bears/ursus-arctos/comments';

      // The author creates a comment.
      const created = await app.inject({
        method: 'POST',
        url: path,
        headers: { cookie: authorCookie },
        payload: {
          author: 'Author',
          text: 'This comment belongs to the author.',
        },
      });

      expect(created.statusCode).toBe(201);

      const comment = CommentViewSchema.parse(created.json());
      const deleteUrl = `/api/comments/${comment.id}`;

      // Act: the attacker attempts to delete the foreign comment.
      const attack = await app.inject({
        method: 'DELETE',
        url: deleteUrl,
        headers: { cookie: attackerCookie },
      });

      // Assert: the server rejects the unauthorized request.
      expect(attack.statusCode).toBe(403);
      expect(attack.json().status).toBe(403);

      // Verify that the attack did not delete the comment.
      const remaining = await app.inject({
        method: 'GET',
        url: path,
        headers: { cookie: authorCookie },
      });

      expect(remaining.statusCode).toBe(200);
      expect(remaining.json().items).toContainEqual(comment);

      // Positive control: the legitimate author can delete it.
      const authorizedDelete = await app.inject({
        method: 'DELETE',
        url: deleteUrl,
        headers: { cookie: authorCookie },
      });

      expect(authorizedDelete.statusCode).toBe(204);

      // Verify that the authorized deletion was successful.
      const afterDeletion = await app.inject({
        method: 'GET',
        url: path,
        headers: { cookie: authorCookie },
      });

      expect(afterDeletion.statusCode).toBe(200);
      expect(afterDeletion.json().items).toEqual([]);
    } finally {
      await app.close();
    }
  }
);