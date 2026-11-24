import { hash, argon2id } from 'argon2';
import { eq } from 'drizzle-orm';
import { createDatabase } from '../src/db/database.js';
import { createPool } from '../src/db/pool.js';
import { users } from '../src/db/schema.js';
import { readEnv } from '../src/env.js';
import { RegisterBodySchema } from '../src/schemas/auth.js';

const input = RegisterBodySchema.safeParse({
  email: process.env.MODERATOR_EMAIL,
  password: process.env.MODERATOR_PASSWORD,
});
if (!input.success) {
  throw new Error(
    'Set MODERATOR_EMAIL and MODERATOR_PASSWORD (at least 12 characters).'
  );
}

const { email, password } = input.data;
const pool = createPool(readEnv().DATABASE_URL);
try {
  const db = createDatabase(pool);
  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hash(password, { type: argon2id }),
      role: 'moderator',
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });
  if (created !== undefined) {
    console.log('Moderator created.');
  } else {
    const [existing] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.email, email));
    if (existing?.role !== 'moderator') {
      throw new Error(
        'Email belongs to another account. Choose an unused moderator email.'
      );
    }
    console.log('Moderator exists. Its current password is still valid.');
  }
} finally {
  await pool.end();
}