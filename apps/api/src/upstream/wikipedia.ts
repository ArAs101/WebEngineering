import { z } from 'zod';
import { UpstreamError, UpstreamTimeoutError } from '../errors.js';

const DEFAULT_BASE_URL = 'https://en.wikipedia.org';

const DEFAULT_USER_AGENT =
  'BearApp/0.1 (https://github.com/ArAs101/WebEngineering)';

const WikipediaWikitextResponse = z.object({
  parse: z.object({
    wikitext: z.string(),
  }),
});

const WikipediaImageResponse = z.object({
  query: z.object({
    pages: z.array(
      z.object({
        imageinfo: z
          .array(
            z.object({
              url: z.url(),
            })
          )
          .optional(),
      })
    ),
  }),
});

async function fetchWikipediaJson(
  params: Record<string, string>
): Promise<unknown> {
  const baseUrl = process.env.WIKIPEDIA_BASE_URL ?? DEFAULT_BASE_URL;
  const userAgent = process.env.USER_AGENT ?? DEFAULT_USER_AGENT;

  const url = new URL('/w/api.php', baseUrl);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new UpstreamTimeoutError();
    }

    throw new UpstreamError();
  }

  if (!response.ok) {
    throw new UpstreamError();
  }

  try {
    const data: unknown = await response.json();
    return data;
  } catch {
    throw new UpstreamError();
  }
}

export async function fetchUrsidsWikitext(): Promise<string> {
  const data = await fetchWikipediaJson({
    action: 'parse',
    page: 'List_of_ursids',
    prop: 'wikitext',
    section: '3',
    format: 'json',
    formatversion: '2',
  });

  const result = WikipediaWikitextResponse.safeParse(data);

  if (!result.success) {
    throw new UpstreamError();
  }

  return result.data.parse.wikitext;
}

export async function fetchWikipediaImageUrl(
  fileName: string
): Promise<string | null> {
  const data = await fetchWikipediaJson({
    action: 'query',
    titles: `File:${fileName}`,
    prop: 'imageinfo',
    iiprop: 'url',
    format: 'json',
    formatversion: '2',
  });

  const result = WikipediaImageResponse.safeParse(data);

  if (!result.success) {
    throw new UpstreamError();
  }

  return result.data.query.pages[0]?.imageinfo?.[0]?.url ?? null;
}
