import type { PublicUser } from '../schemas/auth.js';

export interface UserRepository {
  create: (email: string, passwordHash: string) => Promise<PublicUser | null>;
}
