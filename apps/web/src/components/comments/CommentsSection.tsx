import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from 'react';
import {
  addComment,
  deleteComment,
  loadComments,
  type Comment,
} from '../../scripts/commentService';
import HighlightedText from '../search/HighlightedText';

interface CommentsSectionProps {
  bearId: string;
  searchQuery: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export default function CommentsSection({
  bearId,
  searchQuery,
}: CommentsSectionProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length > 0 &&
    name.trim().length <= 80 &&
    commentText.trim().length > 0 &&
    commentText.trim().length <= 2000;

  // Load comments when the selected bear changes
  useEffect(() => {
    let active = true;

    setComments([]);
    setIsLoading(true);
    setError(null);

    async function fetchComments(): Promise<void> {
      try {
        const items = await loadComments(bearId);

        if (active) {
          setComments(items);
        }
      } catch (error: unknown) {
        if (active) {
          setError(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void fetchComments();

    return () => {
      active = false;
    };
  }, [bearId]);

  function handleToggle(): void {
    setIsOpen((current) => !current);
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>): void {
    setName(event.target.value);
  }

  function handleCommentChange(event: ChangeEvent<HTMLInputElement>): void {
    setCommentText(event.target.value);
  }

  async function submitComment(): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    try {
      const createdComment = await addComment(bearId, {
        author: name.trim(),
        text: commentText.trim(),
      });

      setComments((current) => [...current, createdComment]);
      setName('');
      setCommentText('');
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!canSubmit || isSubmitting) {
      return;
    }

    void submitComment();
  }

  async function handleDelete(commentId: string): Promise<void> {
    setDeletingId(commentId);
    setError(null);

    try {
      await deleteComment(commentId);

      setComments((current) =>
        current.filter((comment) => comment.id !== commentId)
      );
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="comments">
      <button
        className="comments-toggle"
        type="button"
        aria-controls={`comments-content-${bearId}`}
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        {isOpen ? 'Hide comments' : 'Show comments'}
      </button>

      <div
        className="comment-wrapper"
        id={`comments-content-${bearId}`}
        hidden={!isOpen}
      >
        <h3>Add comment</h3>

        <form className="comment-form" onSubmit={handleSubmit} noValidate>
          <div className="flex-pair">
            <label htmlFor="name">Your name:</label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={handleNameChange}
              maxLength={80}
              required
            />
          </div>

          <div className="flex-pair">
            <label htmlFor="comment">Your comment:</label>
            <input
              type="text"
              name="comment"
              id="comment"
              placeholder="Enter your comment"
              value={commentText}
              onChange={handleCommentChange}
              maxLength={2000}
              required
            />
          </div>

          <div>
            <input
              type="submit"
              value={isSubmitting ? 'Submitting...' : 'Submit comment'}
              disabled={!canSubmit || isSubmitting}
            />
          </div>
        </form>

        <h3>Comments</h3>

        {isLoading && <p role="status">Loading comments...</p>}

        {error !== null && (
          <p className="bear-error" role="alert">
            {error}
          </p>
        )}

        {!isLoading && comments.length === 0 && <p>No comments yet.</p>}

        <ul className="comment-container">
          {comments.map((comment) => (
            <li key={comment.id}>
              <p>
                <HighlightedText text={comment.author} query={searchQuery} />
              </p>
              <p>
                <HighlightedText text={comment.text} query={searchQuery} />
              </p>
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => {
                  void handleDelete(comment.id);
                }}
              >
                {deletingId === comment.id ? 'Deleting...' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
