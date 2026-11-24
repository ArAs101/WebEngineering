import { errorFromResponse } from './apiError';
import { apiUrl } from './apiUrl';

export interface Comment {
  id: string;
  bearId: string;
  authorId: string | null;
  canDelete: boolean;
  author: string;
  text: string;
  createdAt: string;
}

export interface NewComment {
  author: string;
  text: string;
}

interface CommentListResponse {
  items: Comment[];
  nextCursor: string | null;
}

function isComment(value: unknown): value is Comment {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const comment = value as Record<string, unknown>;

  return (
    typeof comment.id === 'string' &&
    typeof comment.bearId === 'string' &&
    (comment.authorId === null || typeof comment.authorId === 'string') &&
    typeof comment.canDelete === 'boolean' &&
    typeof comment.author === 'string' &&
    typeof comment.text === 'string' &&
    typeof comment.createdAt === 'string'
  );
}

// GET: Load comments belonging to a bear
export async function loadComments(
  bearId: string,
  cursor?: string
): Promise<CommentListResponse> {
  const params = new URLSearchParams({ limit: '20' });
  if (cursor !== undefined) {
    params.set('cursor', cursor);
  }

  const response = await fetch(
    apiUrl(
      `/api/bears/${encodeURIComponent(bearId)}/comments?${params.toString()}`
    ),
    { credentials: 'include' }
  );

  if (!response.ok) {
    throw await errorFromResponse(response, 'Could not load comments');
  }

  const data: unknown = await response.json();

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid comments API response.');
  }

  const result = data as Partial<CommentListResponse>;

  if (
    !Array.isArray(result.items) ||
    !result.items.every(isComment) ||
    (result.nextCursor !== null && typeof result.nextCursor !== 'string')
  ) {
    throw new Error('Invalid comments data received.');
  }

  return { items: result.items, nextCursor: result.nextCursor };
}

// POST: Create a new comment
export async function addComment(
  bearId: string,
  comment: NewComment
): Promise<Comment> {
  const response = await fetch(
    apiUrl(`/api/bears/${encodeURIComponent(bearId)}/comments`),
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comment),
    }
  );

  if (!response.ok) {
    throw await errorFromResponse(response, `Could not create comment`);
  }

  const data: unknown = await response.json();

  if (!isComment(data)) {
    throw new Error('Invalid comment received.');
  }

  return data;
}

// DELETE: Remove a comment
export async function deleteComment(commentId: string): Promise<void> {
  const response = await fetch(
    apiUrl(`/api/comments/${encodeURIComponent(commentId)}`),
    {
      credentials: 'include',
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw await errorFromResponse(response, `Could not delete comment`);
  }
}
