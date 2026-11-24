import { type FormEvent, type ReactElement, useState } from 'react';
import { registerUser } from '../scripts/authService';

export default function RegisterPage(): ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submitRegistration(): Promise<void> {
    setBusy(true);
    setMessage('');
    try {
      await registerUser(email, password);
      setPassword('');
      setMessage(`Account created for ${email}.`);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : 'Registration failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (Array.from(password).length < 12) {
      setMessage('Use at least 12 characters.');
      return;
    }
    if (!busy) {
      void submitRegistration();
    }
  }

  return (
    <article className="registration">
      <h2>Create account</h2>
      <form method="post" onSubmit={handleSubmit}>
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          disabled={busy}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
        <label htmlFor="register-password">
          Password (at least 12 characters)
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          value={password}
          disabled={busy}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        />
        <button type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p role="status">{message}</p>
      </form>
    </article>
  );
}
