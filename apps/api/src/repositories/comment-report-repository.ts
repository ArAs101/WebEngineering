import type { CommentReportStatus } from '../schemas/comment-report.js';

export interface CommentReportRepository {
  find: (id: string) => Promise<CommentReportStatus | null>;
  save: (status: CommentReportStatus) => Promise<CommentReportStatus | null>;
}
