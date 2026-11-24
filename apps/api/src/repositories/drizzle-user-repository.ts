import type { Database } from '../db/database.js';
import { users } from '../db/schema.js';
import type { UserRepository } from './user-repository.js';

export function createDrizzleUserRepository(db: Database): UserRepository {
  return {
    async create(email, passwordHash) {
      const [user] = await db
        .insert(users)
        .values({ email, passwordHash })
        .onConflictDoNothing({ target: users.email })
        .returning({ id: users.id, email: users.email, role: users.role });

      return user ?? null;
    },
  };
}
