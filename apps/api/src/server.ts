import { buildApp } from './app.js';
import { createPool } from './db/pool.js';
import { env } from './env.js';

const pool = createPool(env.DATABASE_URL);
const app = await buildApp(pool);

await app.listen({ port: env.PORT, host: '0.0.0.0' });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close().catch((error: unknown) => {
      app.log.error({ err: error }, 'Could not shut down API');
      process.exitCode = 1;
    });
  });
}
