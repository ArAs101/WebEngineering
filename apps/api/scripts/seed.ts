import { readFile } from 'node:fs/promises';
import { createDatabase } from '../src/db/database.js';
import { createPool } from '../src/db/pool.js';
import { bears } from '../src/db/schema.js';
import { readEnv } from '../src/env.js';
import { BearSchema } from '../src/schemas/bear.js';

const fixture = BearSchema.array()
  .min(1)
  .parse(
    JSON.parse(await readFile(new URL('./bears.json', import.meta.url), 'utf8'))
  );
const pool = createPool(readEnv().DATABASE_URL);

try {
  const db = createDatabase(pool);
  await db
    .insert(bears)
    .values(fixture)
    .onConflictDoNothing({ target: bears.id });
  console.log('Missing bear fixtures inserted.');
} finally {
  await pool.end();
}
