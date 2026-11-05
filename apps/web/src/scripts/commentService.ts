import { errorFromResponse } from './apiError';
import { apiUrl } from './apiUrl';

export interface Comment {
  id: string;
  bearId: string;
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
    typeof comment.author === 'string' &&
    typeof comment.text === 'string' &&
    typeof comment.createdAt === 'string'
  );
}

// GET: Load comments belonging to a bear
export async function loadComments(bearId: string): Promise<Comment[]> {
  const response = await fetch(
    apiUrl(`/api/bears/${encodeURIComponent(bearId)}/comments`)
  );

  if (!response.ok) {
    throw await errorFromResponse(response, `Could not load comments`);
  }

  const data: unknown = await response.json();

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid comments API response.');
  }

  const result = data as Partial<CommentListResponse>;

  if (!Array.isArray(result.items) || !result.items.every(isComment)) {
    throw new Error('Invalid comments data received.');
  }

  return result.items;
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
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw await errorFromResponse(response, `Could not delete comment`);
  }
}
