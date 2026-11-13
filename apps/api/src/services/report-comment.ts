import { NotFoundError } from '../errors.js';
import type { CommentReportRepository } from '../repositories/comment-report-repository.js';
import type { CommentReportStatus } from '../schemas/comment-report.js';

const HIDE_THRESHOLD = 3;

type RunWithReports = (
  operation: (reports: CommentReportRepository) => Promise<CommentReportStatus>
) => Promise<CommentReportStatus>;

export type ReportComment = (id: string) => Promise<CommentReportStatus>;

export function createReportComment(
  runWithReports: RunWithReports
): ReportComment {
  return async (id) =>
    await runWithReports(async (reports) => {
      const current = await reports.find(id);
      if (current === null) {
        throw new NotFoundError('Comment');
      }

      const reportCount = current.reportCount + 1;
      const hiddenAt =
        current.hiddenAt ??
        (reportCount >= HIDE_THRESHOLD ? new Date().toISOString() : null);
      const updated = await reports.save({ id, reportCount, hiddenAt });

      if (updated === null) {
        throw new NotFoundError('Comment');
      }
      return updated;
    });
}
