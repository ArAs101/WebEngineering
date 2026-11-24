import { type FormEvent, type ReactElement, useState } from 'react';
import { loginUser, type PublicUser } from '../scripts/authService';

export default function LoginPage({
  onLogin,
}: {
  onLogin: (user: PublicUser) => void;
}): ReactElement {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(email: string, password: string): Promise<void> {
    setBusy(true);
    setError('');
    try {
      onLogin(await loginUser(email, password));
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get('email');
    const password = data.get('password');
    if (!busy && typeof email === 'string' && typeof password === 'string') {
      void submit(email, password);
    }
  }

  return (
    <article className="registration">
      <h2>Log in</h2>
      <form method="post" onSubmit={handleSubmit}>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={busy}
        />
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={busy}
        />
        <button type="submit" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        {error !== '' && <p role="alert">{error}</p>}
      </form>
    </article>
  );
}
