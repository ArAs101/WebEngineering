import type { ReactElement } from 'react';

export default function CommentsSection(): ReactElement {
  return (
    <section className="comments">
      <button
        className="comments-toggle"
        type="button"
        aria-controls="comments-content"
        aria-expanded="false"
      >
        Show comments
      </button>
      <div className="comment-wrapper" id="comments-content" hidden>
        <h3>Add comment</h3>
        <form className="comment-form">
          <div className="flex-pair">
            <label htmlFor="name">Your name:</label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter your name"
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
              required
            />
          </div>
          <div>
            <input type="submit" value="Submit comment" />
          </div>
        </form>

        <h3>Comments</h3>
        <ul className="comment-container">
          <li>
            <p>Bob Fossil</p>
            <p>
              Oh I am so glad you taught me all about the big brown angry
              guys...
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
}
