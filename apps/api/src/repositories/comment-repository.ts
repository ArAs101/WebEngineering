import type { Comment, NewComment } from '../schemas/comment.js';

export type CommentCursor = Pick<Comment, 'createdAt' | 'id'>;
export interface CommentRepository {
  findByBearIds: (bearIds: string[]) => Promise<Comment[]>;
  listPage: (
    bearId: string,
    limit: number,
    after?: CommentCursor
  ) => Promise<Comment[]>;
  create: (bearId: string, data: NewComment) => Promise<Comment>;
  remove: (commentId: string) => Promise<boolean>;
}
