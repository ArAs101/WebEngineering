import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from 'react';
import HighlightedText from '../search/HighlightedText';

interface Comment {
  id: string;
  name: string;
  text: string;
}

interface CommentsSectionProps {
  searchQuery: string;
}

const initialComments: Comment[] = [
  {
    id: 'bob-fossil-1',
    name: 'Bob Fossil',
    text: 'Oh I am so glad you taught me all about the big brown angry guys...',
  },
];

export default function CommentsSection({
  searchQuery,
}: CommentsSectionProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const canSubmit = name.trim() !== '' && commentText.trim() !== '';

  function handleToggle(): void {
    setIsOpen((current) => !current);
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>): void {
    setName(event.target.value);
  }

  function handleCommentChange(event: ChangeEvent<HTMLInputElement>): void {
    setCommentText(event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSubmit) {
      window.alert('Please fill in both fields with proper text.');
      return;
    }
    const newComment: Comment = {
      id: crypto.randomUUID(),
      name: name.trim(),
      text: commentText.trim(),
    };
    setComments((currentComments) => [...currentComments, newComment]);
    setName('');
    setCommentText('');
  }

  return (
    <section className="comments">
      <button
        className="comments-toggle"
        type="button"
        aria-controls="comments-content"
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        {isOpen ? 'Hide comments' : 'Show comments'}
      </button>
      <div className="comment-wrapper" id="comments-content" hidden={!isOpen}>
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
              required
            />
          </div>
          <div>
            <input type="submit" value="Submit comment" />
          </div>
        </form>

        <h3>Comments</h3>
        <ul className="comment-container">
          {comments.map((comment) => (
            <li key={comment.id}>
              <p>
                <HighlightedText text={comment.name} query={searchQuery} />
              </p>
              <p>
                <HighlightedText text={comment.text} query={searchQuery} />
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
