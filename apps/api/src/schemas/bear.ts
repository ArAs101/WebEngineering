import { z } from 'zod';

export const BearId = z.string().regex(/^[a-z]+(-[a-z]+)*$/);

export const BearSchema = z.object({
  id: BearId,
  name: z.string().min(1),
  binomial: z.string().min(1),
  imageUrl: z.url().nullable(),
  range: z.string(),
});

z.globalRegistry.add(BearSchema, {
  id: 'Bear',
});

export type Bear = z.infer<typeof BearSchema>;

function wikiField(block: string, key: string): string {
  const start = new RegExp('\\|\\s*' + key + '\\s*=\\s*', 'i').exec(block);
  if (start === null) return '';

  const rest = block.slice(start.index + start[0].length);
  const [value] = rest.split(/\r?\n|\|\s*[\w-]+\s*=|\}\}/, 1);

  // [[Article|Display name]] and [[Display name]] both yield the visible text.
  return value.replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1').trim();
}

export function parseWikipediaBears(payload: unknown): Bear[] {
  const page = z
    .object({ parse: z.object({ wikitext: z.string() }) })
    .parse(payload);

  const species = new Map<string, Bear>();
  const tables = page.parse.wikitext
    .split(/\{\{\s*Species table\s*(?=\|)/i)
    .slice(1);

  for (const table of tables) {
    const [body] = table.split(/\{\{\s*Species table\/end\b/i, 1);
    const [header, ...rows] = body.split(/\{\{\s*Species table\/row\b/i);
    const genus = wikiField(header, 'genus');

    for (const row of rows) {
      const binomial = wikiField(row, 'binomial').replace(
        /^[A-Z]\.\s+/,
        genus + ' '
      );
      const file = wikiField(row, 'image').replace(/^(?:File|Image):\s*/i, '');
      const range = wikiField(row, 'range');
      if (range === '') throw new Error('Missing range for ' + binomial);

      const bear = BearSchema.parse({
        id: binomial.toLowerCase().replace(/\s+/g, '-'),
        name: wikiField(row, 'name'),
        binomial,
        range,
        imageUrl:
          file === ''
            ? null
            : 'https://en.wikipedia.org/wiki/Special:FilePath/' +
              encodeURIComponent(file) +
              '?width=330',
      });

      if (species.has(bear.id))
        throw new Error('Duplicate bear ID: ' + bear.id);
      species.set(bear.id, bear);
    }
  }

  if (species.size === 0)
    throw new Error('No bear species found on Wikipedia.');
  return [...species.values()];
}
