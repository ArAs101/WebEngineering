import type { Bear } from './types';

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

export async function loadBears(): Promise<Bear[]> {
  const response = await fetch('/api/bears');

  if (!response.ok) {
    throw new Error(`Bear API request failed: HTTP ${response.status}`);
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
