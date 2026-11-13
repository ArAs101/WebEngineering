import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { Database } from '../db/database.js';
import { comments } from '../db/schema.js';
import type { Comment } from '../schemas/comment.js';
import type { CommentRepository } from './comment-repository.js';

function toComment(row: typeof comments.$inferSelect): Comment {
  return {
    id: row.id,
    bearId: row.bearId,
    author: row.author,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createDrizzleCommentRepository(
  db: Database
): CommentRepository {
  return {
    async findByBearIds(bearIds) {
      if (bearIds.length === 0) {
        return [];
      }

      const rows = await db
        .select()
        .from(comments)
        .where(
          and(inArray(comments.bearId, bearIds), isNull(comments.hiddenAt))
        )
        .orderBy(asc(comments.createdAt), asc(comments.id));
      return rows.map(toComment);
    },
    async listPage(bearId, limit, after) {
      const afterCursor =
        after === undefined
          ? undefined
          : sql`(${comments.createdAt}, ${comments.id}) < (${after.createdAt}::timestamptz, ${after.id}::uuid)`;

      const rows = await db
        .select()
        .from(comments)
        .where(and(eq(comments.bearId, bearId), afterCursor))
        .orderBy(desc(comments.createdAt), desc(comments.id))
        .limit(limit);

      return rows.map(toComment);
    },
    async create(bearId, data) {
      const [row] = await db
        .insert(comments)
        .values({ bearId, author: data.author, text: data.text })
        .returning();
      return toComment(row);
    },
    async remove(id) {
      const rows = await db
        .delete(comments)
        .where(eq(comments.id, id))
        .returning({ id: comments.id });
      return rows.length === 1;
    },
  };
}
