import type { Comment, NewComment } from '../schemas/comment.js';

export interface CommentRepository {
  findByBearIds: (bearIds: string[]) => Promise<Comment[]>;
  create: (bearId: string, data: NewComment) => Promise<Comment>;
  remove: (commentId: string) => Promise<boolean>;
}
