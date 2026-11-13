import { randomUUID } from 'node:crypto';
import type { BearRepository } from '../src/repositories/bear-repository.js';
import type { CommentRepository } from '../src/repositories/comment-repository.js';
import type { Bear } from '../src/schemas/bear.js';
import type { Comment } from '../src/schemas/comment.js';

export function createMemoryBearRepository(fixture: Bear[]): BearRepository {
  const bears = new Map(fixture.map((bear) => [bear.id, bear]));

  return {
    list: () =>
      Promise.resolve(
        [...bears.values()].sort((a, b) => a.name.localeCompare(b.name))
      ),
    findById: (id) => Promise.resolve(bears.get(id) ?? null),
  };
}

export function createMemoryCommentRepository(): CommentRepository {
  const comments = new Map<string, Comment>();

  return {
    findByBearIds: (bearIds) =>
      Promise.resolve(
        [...comments.values()].filter((comment) =>
          bearIds.includes(comment.bearId)
        )
      ),
    create: (bearId, data) => {
      const comment: Comment = {
        id: randomUUID(),
        bearId,
        author: data.author,
        text: data.text,
        createdAt: new Date().toISOString(),
      };
      comments.set(comment.id, comment);
      return Promise.resolve(comment);
    },
    remove: (id) => Promise.resolve(comments.delete(id)),
  };
}
