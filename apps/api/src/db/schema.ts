import { sql } from 'drizzle-orm';
import {
  check,
  jsonb,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { Session } from 'fastify';

export const userRole = pgEnum('user_role', ['user', 'moderator']);

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRole().notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: text().primaryKey(),
    data: jsonb().$type<Session>().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('sessions_expires_idx').on(table.expiresAt)]
);

export const bears = pgTable('bears', {
  id: text().primaryKey(),
  name: text().notNull(),
  binomial: text().notNull().unique(),
  imageUrl: text('image_url'),
  range: text().notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const comments = pgTable(
  'comments',
  {
    id: uuid().primaryKey().defaultRandom(),
    bearId: text('bear_id')
      .notNull()
      .references(() => bears.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    author: text().notNull(),
    text: text().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
    reportCount: integer('report_count').notNull().default(0),
    hiddenAt: timestamp('hidden_at', { withTimezone: true, precision: 3 }),
  },
  (table) => [
    check(
      'comments_author_length',
      sql`char_length(${table.author}) BETWEEN 1 AND 80`
    ),
    check(
      'comments_text_length',
      sql`char_length(${table.text}) BETWEEN 1 AND 2000`
    ),
    index('comments_bear_created_idx').on(
      table.bearId,
      table.createdAt,
      table.id
    ),
  ]
);
