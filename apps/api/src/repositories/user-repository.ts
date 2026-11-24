import type { PublicUser } from '../schemas/auth.js';

export interface UserRepository {
  findByEmail: (
    email: string
  ) => Promise<(PublicUser & { passwordHash: string }) | null>;
  findById: (id: string) => Promise<PublicUser | null>;
  create: (email: string, passwordHash: string) => Promise<PublicUser | null>;
}
