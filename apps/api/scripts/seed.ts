import { readFile } from 'node:fs/promises';
import { sql } from 'drizzle-orm';
import { createDatabase } from '../src/db/database.js';
import { createPool } from '../src/db/pool.js';
import { bears } from '../src/db/schema.js';
import { env } from '../src/env.js';
import { BearSchema } from '../src/schemas/bear.js';

const fixture = BearSchema.array()
  .min(1)
  .parse(
    JSON.parse(await readFile(new URL('./bears.json', import.meta.url), 'utf8'))
  );
const pool = createPool(env.DATABASE_URL);

try {
  const db = createDatabase(pool);
  await db
    .insert(bears)
    .values(fixture)
    .onConflictDoUpdate({
      target: bears.id,
      set: {
        name: sql`excluded.name`,
        binomial: sql`excluded.binomial`,
        imageUrl: sql`excluded.image_url`,
        range: sql`excluded.range`,
        fetchedAt: sql`excluded.fetched_at`,
      },
    });
  console.log(`Upserted ${fixture.length} bear species.`);
} finally {
  await pool.end();
}
