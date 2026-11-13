import { asc, eq } from 'drizzle-orm';
import type { Database } from '../db/database.js';
import { bears } from '../db/schema.js';
import type { Bear } from '../schemas/bear.js';

const bearFields = {
  id: bears.id,
  name: bears.name,
  binomial: bears.binomial,
  imageUrl: bears.imageUrl,
  range: bears.range,
};

export async function getBears(db: Database): Promise<Bear[]> {
  return await db.select(bearFields).from(bears).orderBy(asc(bears.name));
}

export async function getBearById(
  db: Database,
  id: string
): Promise<Bear | null> {
  const [bear] = await db
    .select(bearFields)
    .from(bears)
    .where(eq(bears.id, id));
  return bear ?? null;
}
