import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { defineConfig } from 'drizzle-kit';
import { readDatabaseUrl } from './src/env';

const rootEnv = '../../.env';
if (existsSync(rootEnv)) loadEnvFile(rootEnv);
const hasDatabaseConfig =
  process.env.DATABASE_URL !== undefined ||
  process.env.POSTGRES_PASSWORD !== undefined;

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  ...(hasDatabaseConfig ? { dbCredentials: { url: readDatabaseUrl() } } : {}),
});
