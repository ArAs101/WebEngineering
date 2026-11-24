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
