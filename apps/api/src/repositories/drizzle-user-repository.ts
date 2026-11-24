import { eq } from 'drizzle-orm';
import type { Database } from '../db/database.js';
import { users } from '../db/schema.js';
import type { UserRepository } from './user-repository.js';

export function createDrizzleUserRepository(db: Database): UserRepository {
  const publicFields = { id: users.id, email: users.email, role: users.role };
  return {
    async findByEmail(email) {
      const [user] = await db
        .select({ ...publicFields, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.email, email));
      return user ?? null;
    },
    async findById(id) {
      const [user] = await db
        .select(publicFields)
        .from(users)
        .where(eq(users.id, id));
      return user ?? null;
    },
    async create(email, passwordHash) {
      const [user] = await db
        .insert(users)
        .values({ email, passwordHash })
        .onConflictDoNothing({ target: users.email })
        .returning(publicFields);

      return user ?? null;
    },
  };
}
