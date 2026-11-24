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
    authorId: row.authorId,
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
        .where(
          and(
            eq(comments.bearId, bearId),
            isNull(comments.hiddenAt),
            afterCursor
          )
        )
        .orderBy(desc(comments.createdAt), desc(comments.id))
        .limit(limit);

      return rows.map(toComment);
    },
    async create(bearId, data, authorId) {
      const [row] = await db
        .insert(comments)
        .values({ bearId, authorId, author: data.author, text: data.text })
        .returning();
      return toComment(row);
    },
    async removeIf(id, allowed) {
      return await db.transaction(async (tx) => {
        const [row] = await tx
          .select({ authorId: comments.authorId })
          .from(comments)
          .where(eq(comments.id, id))
          .for('update');
        if (row === undefined) return 'missing';
        if (!allowed(row.authorId)) return 'forbidden';

        await tx.delete(comments).where(eq(comments.id, id));
        return 'removed';
      });
    },
  };
}
