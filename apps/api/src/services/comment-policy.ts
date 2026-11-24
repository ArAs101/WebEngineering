import type { PublicUser } from '../schemas/auth.js';
import type { Comment, CommentView } from '../schemas/comment.js';

export function canDeleteComment(
  viewer: PublicUser | null,
  authorId: string | null
): boolean {
  return (
    viewer !== null && (viewer.role === 'moderator' || viewer.id === authorId)
  );
}

export function viewComment(
  comment: Comment,
  viewer: PublicUser | null
): CommentView {
  return { ...comment, canDelete: canDeleteComment(viewer, comment.authorId) };
}
