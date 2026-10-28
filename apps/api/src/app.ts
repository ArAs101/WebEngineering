import Fastify, { type FastifyInstance } from 'fastify';
import { bearRoutes } from './routes/bears.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({
    status: 'ok',
    version: process.env.APP_VERSION ?? 'dev',
    uptime: Math.round(process.uptime()),
  }));

  await app.register(bearRoutes);
  return await app;
}
