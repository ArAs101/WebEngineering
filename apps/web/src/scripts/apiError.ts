interface ProblemDetails {
  detail: string;
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'detail' in value &&
    typeof value.detail === 'string' &&
    value.detail.trim().length > 0
  );
}

export async function errorFromResponse(
  response: Response,
  context: string
): Promise<Error> {
  const fallback = new Error(`${context}: HTTP ${response.status}`);

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/problem+json')) {
    return fallback;
  }

  try {
    const data: unknown = await response.json();

    if (isProblemDetails(data)) {
      return new Error(data.detail);
    }
  } catch {
    return fallback;
  }

  return fallback;
}
