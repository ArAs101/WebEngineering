import { Pool } from 'pg';

export function createPool(connectionString: string): Pool {
  return new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 2_000,
    statement_timeout: 2_000,
    query_timeout: 3_000,
  });
}
