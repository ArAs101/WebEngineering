import { randomUUID } from 'node:crypto';
import type { BearRepository } from '../src/repositories/bear-repository.js';
import type { CommentRepository } from '../src/repositories/comment-repository.js';
import type { Bear } from '../src/schemas/bear.js';
import type { Comment } from '../src/schemas/comment.js';
import type { CommentReportRepository } from '../src/repositories/comment-report-repository.js';
import type { CommentReportStatus } from '../src/schemas/comment-report.js';
import type { UserRepository } from '../src/repositories/user-repository.js';
import type { PublicUser } from '../src/schemas/auth.js';

export function createMemoryUserRepository(
  accounts = new Map<string, PublicUser & { passwordHash: string }>()
): UserRepository {
  return {
    create(email, passwordHash) {
      if (accounts.has(email)) {
        return Promise.resolve(null);
      }

      const user: PublicUser = { id: randomUUID(), email, role: 'user' };
      accounts.set(email, { ...user, passwordHash });
      return Promise.resolve(user);
    },
  };
}

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

export function createMemoryCommentRepository(): CommentRepository &
  CommentReportRepository {
  const comments = new Map<string, Comment>();
  const reports = new Map<string, CommentReportStatus>();

  function isVisible(comment: Comment): boolean {
    return reports.get(comment.id)?.hiddenAt === null;
  }

  return {
    findByBearIds: (bearIds) =>
      Promise.resolve(
        [...comments.values()].filter(
          (comment) => bearIds.includes(comment.bearId) && isVisible(comment)
        )
      ),
    listPage: (bearId, limit, after) => {
      const items = [...comments.values()]
        .filter((comment) => comment.bearId === bearId && isVisible(comment))
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
      reports.set(comment.id, {
        id: comment.id,
        reportCount: 0,
        hiddenAt: null,
      });
      return Promise.resolve(comment);
    },
    remove: (id) => {
      reports.delete(id);
      return Promise.resolve(comments.delete(id));
    },
    find: (id) => Promise.resolve(reports.get(id) ?? null),
    save: (status) => {
      if (!reports.has(status.id)) {
        return Promise.resolve(null);
      }
      reports.set(status.id, status);
      return Promise.resolve(status);
    },
  };
}
