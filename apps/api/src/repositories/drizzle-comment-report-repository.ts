import { eq } from 'drizzle-orm';
import type { Database } from '../db/database.js';
import { comments } from '../db/schema.js';
import type { CommentReportStatus } from '../schemas/comment-report.js';
import type { CommentReportRepository } from './comment-report-repository.js';

const reportFields = {
  id: comments.id,
  reportCount: comments.reportCount,
  hiddenAt: comments.hiddenAt,
};

function toReportStatus(row: {
  id: string;
  reportCount: number;
  hiddenAt: Date | null;
}): CommentReportStatus {
  return { ...row, hiddenAt: row.hiddenAt?.toISOString() ?? null };
}

export function createDrizzleCommentReportRepository(
  db: Pick<Database, 'select' | 'update'>
): CommentReportRepository {
  return {
    async find(id) {
      const [row] = await db
        .select(reportFields)
        .from(comments)
        .where(eq(comments.id, id))
        .for('update');
      return row === undefined ? null : toReportStatus(row);
    },
    async save(status) {
      const [row] = await db
        .update(comments)
        .set({
          reportCount: status.reportCount,
          hiddenAt: status.hiddenAt === null ? null : new Date(status.hiddenAt),
        })
        .where(eq(comments.id, status.id))
        .returning(reportFields);
      return row === undefined ? null : toReportStatus(row);
    },
  };
}
