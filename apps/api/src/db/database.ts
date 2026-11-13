import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';

export type Database = NodePgDatabase;

export function createDatabase(pool: Pool): Database {
  return drizzle(pool);
}
