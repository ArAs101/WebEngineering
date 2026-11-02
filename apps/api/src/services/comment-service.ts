import { randomUUID } from 'node:crypto';
import type { Comment, NewComment } from '../schemas/comment.js';

export interface CommentService {
  findByBearId: (bearId: string) => Comment[];
  create: (bearId: string, data: NewComment) => Comment;
  remove: (commentId: string) => boolean;
}

export function createCommentService(): CommentService {
  const comments = new Map<string, Comment>();

  function findByBearId(bearId: string): Comment[] {
    return [...comments.values()].filter(
      (comment) => comment.bearId === bearId
    );
  }

  function create(bearId: string, data: NewComment): Comment {
    const comment: Comment = {
      id: randomUUID(),
      bearId,
      author: data.author,
      text: data.text,
      createdAt: new Date().toISOString(),
    };

    comments.set(comment.id, comment);

    return comment;
  }

  function remove(commentId: string): boolean {
    return comments.delete(commentId);
  }

  return {
    findByBearId,
    create,
    remove,
  };
}
