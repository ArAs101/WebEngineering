import { buildApp } from './app.js';
import { createDatabase } from './db/database.js';
import { createPool } from './db/pool.js';
import { readEnv } from './env.js';
import { createDrizzleBearRepository } from './repositories/drizzle-bear-repository.js';
import { createDrizzleCommentRepository } from './repositories/drizzle-comment-repository.js';

const env = readEnv();
const pool = createPool(env.DATABASE_URL);
const db = createDatabase(pool);
const app = await buildApp({
  bears: createDrizzleBearRepository(db),
  comments: createDrizzleCommentRepository(db),
  appVersion: env.APP_VERSION,
  corsOrigins: env.CORS_ORIGINS,
  checkDatabase: async () => {
    await pool.query('SELECT 1');
  },
  closeDatabase: async () => {
    await pool.end();
  },
});
pool.on('error', (error) => {
  app.log.warn({ err: error }, 'Idle PostgreSQL connection failed');
});

await app.listen({ port: env.PORT, host: '0.0.0.0' });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close().catch((error: unknown) => {
      app.log.error({ err: error }, 'Could not shut down API');
      process.exitCode = 1;
    });
  });
}
