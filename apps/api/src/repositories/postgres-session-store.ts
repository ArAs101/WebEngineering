import type { SessionStore } from '@fastify/session';
import type { Session } from 'fastify';
import { and, eq, gt, lte, sql } from 'drizzle-orm';
import type { Database } from '../db/database.js';
import { sessions } from '../db/schema.js';

export function createPostgresSessionStore(db: Database): SessionStore {
  const now = sql`now()`;
  const live = gt(sessions.expiresAt, now);
  // This is the generation field defined by @fastify/session's store contract.
  const generation = sql`coalesce(${sessions.data} -> '__fastifySessionMetadata' ->> 'generation', ${sessions.id})`;

  function values(session: Session): { data: Session; expiresAt: Date } {
    return { data: session, expiresAt: session.cookie.expires ?? new Date(0) };
  }

  return {
    get(id, done) {
      void db
        .select({ data: sessions.data })
        .from(sessions)
        .where(and(eq(sessions.id, id), live))
        .then(([row]) => {
          done(null, row?.data ?? null);
        }, done);
    },
    set(id, session, done) {
      void db
        .transaction(async (tx) => {
          await tx.delete(sessions).where(lte(sessions.expiresAt, now));
          await tx.insert(sessions).values({ id, ...values(session) });
        })
        .then(() => {
          done();
        }, done);
    },
    compareAndSet(id, expectedGeneration, session, done) {
      void db
        .update(sessions)
        .set(values(session))
        .where(
          and(eq(sessions.id, id), live, eq(generation, expectedGeneration))
        )
        .returning({ id: sessions.id })
        .then((rows) => {
          if (rows.length === 0) {
            done(
              Object.assign(new Error('Session expired or changed.'), {
                code: 'ENOENT',
              })
            );
            return;
          }
          done();
        }, done);
    },
    destroy(id, done) {
      void db
        .delete(sessions)
        .where(eq(sessions.id, id))
        .then(() => {
          done();
        }, done);
    },
  };
}
