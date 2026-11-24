import type { Session } from 'fastify';
import { AuthenticationError } from '../errors.js';
import type { UserRepository } from '../repositories/user-repository.js';
import type { PublicUser } from '../schemas/auth.js';
import type { CookieOptions } from '@fastify/session';

declare module 'fastify' {
  interface Session {
    userId?: string;
  }
}

export const sessionCookieName = 'bears.sid';
export const sessionLifetimeMs = 8 * 60 * 60 * 1000;

export function sessionCookieOptions(secure: boolean): CookieOptions {
  return { path: '/', httpOnly: true, sameSite: 'lax', secure };
}

export async function getSessionUser(
  session: Session,
  users: UserRepository
): Promise<PublicUser | null> {
  return session.userId === undefined
    ? null
    : await users.findById(session.userId);
}

export async function requireSessionUser(
  session: Session,
  users: UserRepository
): Promise<PublicUser> {
  const user = await getSessionUser(session, users);
  if (user === null) throw new AuthenticationError('Log in to continue.');
  return user;
}
