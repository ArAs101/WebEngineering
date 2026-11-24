import { asc, eq, ilike, sql } from 'drizzle-orm';
import type { Database } from '../db/database.js';
import { bears } from '../db/schema.js';
import { parseWikipediaBears, type Bear } from '../schemas/bear.js';
import type { BearRepository } from './bear-repository.js';

const bearFields = {
  id: bears.id,
  name: bears.name,
  binomial: bears.binomial,
  imageUrl: bears.imageUrl,
  range: bears.range,
};

export function createDrizzleBearRepository(db: Database): BearRepository {
  let lastOrder: string[] | undefined;
  let cached: Promise<string[]> | undefined;
  let refreshAfter = 0;

  async function refresh(): Promise<string[]> {
    let species: Bear[];
    try {
      const url =
        'https://en.wikipedia.org/w/api.php?action=parse&page=List_of_ursids&prop=wikitext&format=json&formatversion=2';
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'BearApp/1.0 (https://github.com/ArAs101/WebEngineering)',
        },
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok)
        throw new Error(`Wikipedia returned HTTP ${response.status}.`);
      species = parseWikipediaBears(await response.json());
    } catch (error) {
      if (lastOrder === undefined) {
        const stored = await db
          .select({ id: bears.id })
          .from(bears)
          .orderBy(asc(bears.name));
        if (stored.length === 0) throw error;
        lastOrder = stored.map((bear) => bear.id);
      }
      refreshAfter = Date.now() + 30_000;
      return lastOrder;
    }

    await db
      .insert(bears)
      .values(species)
      .onConflictDoUpdate({
        target: bears.id,
        set: {
          name: sql`excluded.name`,
          binomial: sql`excluded.binomial`,
          range: sql`excluded.range`,
          imageUrl: sql`excluded.image_url`,
          fetchedAt: sql`excluded.fetched_at`,
        },
      });

    lastOrder = species.map((bear) => bear.id);
    refreshAfter = Date.now() + 10 * 60_000;
    return lastOrder;
  }

  async function catalogueOrder(): Promise<string[]> {
    if (cached === undefined || Date.now() >= refreshAfter) {
      // Requests share this promise until the refresh sets the next deadline.
      refreshAfter = Infinity;
      cached = refresh().catch((error: unknown) => {
        refreshAfter = Date.now() + 30_000;
        throw error;
      });
    }
    return await cached;
  }

  return {
    async list(query) {
      const order = await catalogueOrder();
      const pattern = query?.replace(/[\\%_]/g, '\\$&');
      const rows = await db
        .select(bearFields)
        .from(bears)
        .where(
          pattern !== undefined && pattern !== ''
            ? ilike(bears.name, '%' + pattern + '%')
            : undefined
        );

      const byId = new Map(rows.map((bear) => [bear.id, bear]));
      return order
        .map((id) => byId.get(id))
        .filter((bear): bear is Bear => bear !== undefined);
    },

    async findById(id) {
      await catalogueOrder();
      const [bear] = await db
        .select(bearFields)
        .from(bears)
        .where(eq(bears.id, id));
      return bear ?? null;
    },
  };
}
