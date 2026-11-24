import type { SyntheticEvent } from 'react';
import type { Bear } from './types';
import { errorFromResponse } from './apiError';
import { apiUrl } from './apiUrl';

const PLACEHOLDER_IMAGE = new URL(
  '../media/bear_placeholder.png',
  import.meta.url
).href;

interface ApiBear {
  id: string;
  name: string;
  binomial: string;
  range: string;
  imageUrl: string | null;
}

export function showBearPlaceholder(
  event: SyntheticEvent<HTMLImageElement>
): void {
  const image = event.currentTarget;
  if (image.src !== PLACEHOLDER_IMAGE) image.src = PLACEHOLDER_IMAGE;
}

function isApiBear(value: unknown): value is ApiBear {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const bear = value as Record<string, unknown>;

  return (
    typeof bear.id === 'string' &&
    typeof bear.name === 'string' &&
    typeof bear.binomial === 'string' &&
    typeof bear.range === 'string' &&
    (typeof bear.imageUrl === 'string' || bear.imageUrl === null)
  );
}

export async function loadBears(query = ''): Promise<Bear[]> {
  const params = new URLSearchParams({ q: query });
  const path = query === '' ? '/api/bears' : `/api/bears?${params.toString()}`;
  const response = await fetch(apiUrl(path));

  if (!response.ok) {
    throw await errorFromResponse(response, 'Bear API request failed');
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Invalid bear API response.');
  }

  return data.map((item: unknown): Bear => {
    if (!isApiBear(item)) {
      throw new Error('Invalid bear data received.');
    }

    return {
      id: item.id,
      name: item.name,
      binomial: item.binomial,
      range: item.range,
      image: item.imageUrl ?? PLACEHOLDER_IMAGE,
    };
  });
}
