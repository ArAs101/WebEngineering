import { errorFromResponse } from './apiError';
import { apiUrl } from './apiUrl';

export async function registerUser(
  email: string,
  password: string
): Promise<void> {
  const response = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw await errorFromResponse(response, 'Could not create account');
  }
}
