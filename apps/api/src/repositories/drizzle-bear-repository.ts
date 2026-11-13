import { asc, eq } from 'drizzle-orm';
import type { Database } from '../db/database.js';
import { bears } from '../db/schema.js';
import type { BearRepository } from './bear-repository.js';

const bearFields = {
  id: bears.id,
  name: bears.name,
  binomial: bears.binomial,
  imageUrl: bears.imageUrl,
  range: bears.range,
};

export function createDrizzleBearRepository(db: Database): BearRepository {
  return {
    async list() {
      return await db.select(bearFields).from(bears).orderBy(asc(bears.name));
    },
    async findById(id) {
      const [bear] = await db
        .select(bearFields)
        .from(bears)
        .where(eq(bears.id, id));
      return bear ?? null;
    },
  };
}
