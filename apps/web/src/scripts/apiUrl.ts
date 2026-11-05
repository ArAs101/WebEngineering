export function apiUrl(path: string): string {
  const configuredBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;

  const baseUrl =
    typeof configuredBaseUrl === 'string'
      ? configuredBaseUrl.replace(/\/+$/, '')
      : '';

  return `${baseUrl}${path}`;
}
