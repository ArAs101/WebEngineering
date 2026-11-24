import { errorFromResponse } from './apiError';
import { apiUrl } from './apiUrl';

export async function registerUser(
  email: string,
  password: string
): Promise<void> {
  const response = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw await errorFromResponse(response, 'Could not create account');
  }
}

export interface PublicUser {
  id: string;
  email: string;
  role: 'user' | 'moderator';
}

async function readUser(response: Response): Promise<PublicUser> {
  const value: unknown = await response.json();
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !('email' in value) ||
    typeof value.email !== 'string' ||
    !('role' in value) ||
    (value.role !== 'user' && value.role !== 'moderator')
  ) {
    throw new Error('Invalid user response.');
  }
  return { id: value.id, email: value.email, role: value.role };
}

export async function loginUser(
  email: string,
  password: string
): Promise<PublicUser> {
  const response = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await errorFromResponse(response, 'Login failed');
  return await readUser(response);
}

export async function getCurrentUser(
  signal: AbortSignal
): Promise<PublicUser | null> {
  const response = await fetch(apiUrl('/api/auth/me'), {
    credentials: 'include',
    signal,
  });
  if (response.status === 401) return null;
  if (!response.ok)
    throw await errorFromResponse(response, 'Could not load account');
  return await readUser(response);
}

export async function logoutUser(): Promise<void> {
  const response = await fetch(apiUrl('/api/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw await errorFromResponse(response, 'Logout failed');
}
