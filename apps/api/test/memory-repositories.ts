import { randomUUID } from 'node:crypto';
import type { BearRepository } from '../src/repositories/bear-repository.js';
import type { CommentRepository } from '../src/repositories/comment-repository.js';
import type { Bear } from '../src/schemas/bear.js';
import type { Comment } from '../src/schemas/comment.js';

export function createMemoryBearRepository(fixture: Bear[]): BearRepository {
  const bears = new Map(fixture.map((bear) => [bear.id, bear]));

  return {
    list: (query = '') =>
      Promise.resolve(
        [...bears.values()]
          .filter((bear) =>
            bear.name.toLowerCase().includes(query.toLowerCase())
          )
          .sort((a, b) => a.name.localeCompare(b.name))
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
    listPage: (bearId, limit, after) => {
      const items = [...comments.values()]
        .filter((comment) => comment.bearId === bearId)
        .filter(
          (comment) =>
            after === undefined ||
            comment.createdAt < after.createdAt ||
            (comment.createdAt === after.createdAt && comment.id < after.id)
        )
        .sort((a, b) => {
          const timeOrder = b.createdAt.localeCompare(a.createdAt);
          return timeOrder === 0 ? b.id.localeCompare(a.id) : timeOrder;
        });

      return Promise.resolve(items.slice(0, limit));
    },
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
