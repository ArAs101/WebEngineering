import Fastify, { type FastifyInstance } from 'fastify';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({
    status: 'ok',
    version: process.env.APP_VERSION ?? 'dev',
    uptime: Math.round(process.uptime()),
  }));

  return app;
}
