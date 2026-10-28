import { BearSchema, type Bear } from '../schemas/bear.js';
import { UpstreamError } from '../errors.js';
import {
  fetchUrsidsWikitext,
  fetchWikipediaImageUrl,
} from '../upstream/wikipedia.js';
import { toBearId } from './bear-id.js';

interface ParsedBear {
  name: string;
  binomial: string;
  range: string;
  imageFileName: string | null;
}

const GENUS_NAMES: Record<string, string> = {
  A: 'Ailuropoda',
  T: 'Tremarctos',
  H: 'Helarctos',
  M: 'Melursus',
  U: 'Ursus',
};

function normalizeBinomial(binomial: string): string {
  const match = /^([A-Z])\.\s+([a-z]+)$/.exec(binomial.trim());

  if (match === null) {
    return binomial.trim();
  }

  const genus = GENUS_NAMES[match[1]];

  if (genus === undefined) {
    throw new UpstreamError();
  }

  return `${genus} ${match[2]}`;
}

function parseBearRow(row: string): ParsedBear {
  const nameMatch = row.match(/\|name=\[\[(.*?)\]\]/);
  const binomialMatch = row.match(/\|binomial=([^|\n]*)/);
  const imageMatch = row.match(/\|image=([^|\n]*)/);
  const rangeMatch = row.match(/\|range=([^|\n]*)/);

  if (nameMatch === null || binomialMatch === null || rangeMatch === null) {
    throw new UpstreamError();
  }

  return {
    name: nameMatch[1].trim(),
    binomial: binomialMatch[1].trim(),
    range: rangeMatch[1].trim(),
    imageFileName:
      imageMatch !== null ? imageMatch[1].trim().replace('File:', '') : null,
  };
}

async function resolveImageUrl(
  fileName: string | null
): Promise<string | null> {
  if (fileName === null || fileName === '') {
    return null;
  }

  try {
    return await fetchWikipediaImageUrl(fileName);
  } catch (error: unknown) {
    console.warn(`Could not resolve image for ${fileName}`, error);
    return null;
  }
}

async function parseBear(row: string): Promise<Bear> {
  const parsed = parseBearRow(row);

  const binomial = normalizeBinomial(parsed.binomial);
  const imageUrl = await resolveImageUrl(parsed.imageFileName);

  const result = BearSchema.safeParse({
    id: toBearId(binomial),
    name: parsed.name,
    binomial,
    range: parsed.range,
    imageUrl,
  });

  if (!result.success) {
    throw new UpstreamError();
  }

  return result.data;
}

export async function getBears(): Promise<Bear[]> {
  const wikitext = await fetchUrsidsWikitext();

  const rows = wikitext.split('{{Species table/row').slice(1);

  if (rows.length === 0) {
    throw new UpstreamError();
  }

  const bears = await Promise.all(rows.map(parseBear));

  const uniqueIds = new Set(bears.map((bear) => bear.id));

  if (uniqueIds.size !== bears.length) {
    throw new UpstreamError();
  }

  return bears;
}
