import { asc, eq, ilike } from 'drizzle-orm';
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
    async list(query) {
      const pattern = query?.replace(/[\\%_]/g, '\\$&');
      return await db
        .select(bearFields)
        .from(bears)
        .where(
          pattern !== undefined && pattern !== ''
            ? ilike(bears.name, '%' + pattern + '%')
            : undefined
        )
        .orderBy(asc(bears.name));
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
