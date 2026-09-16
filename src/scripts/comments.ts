import { getRequiredElement } from './dom';

function createCommentElement(name: string, comment: string): HTMLLIElement {
    const listItem = document.createElement('li');
    const nameParagraph = document.createElement('p');
    const commentParagraph = document.createElement('p');
    nameParagraph.textContent = name;
    commentParagraph.textContent = comment;
    listItem.append(
        nameParagraph,
        commentParagraph
    );

    return listItem;
}

export function initComments(): void {
    // Show/hide comments toggle
    const toggleCommentsButton = getRequiredElement<HTMLButtonElement>('.comments-toggle');
    const commentWrapper = getRequiredElement<HTMLElement>('.comment-wrapper');
    // Comment form stuff
    const commentForm = getRequiredElement<HTMLFormElement>('.comment-form');
    const nameInput = getRequiredElement<HTMLInputElement>('#name');
    const commentInput = getRequiredElement<HTMLInputElement>('#comment');
    const commentList = getRequiredElement<HTMLUListElement>('.comment-container');
    toggleCommentsButton.addEventListener('click', () => {
      commentWrapper.hidden = !commentWrapper.hidden;
      const isExpanded = !commentWrapper.hidden;
      toggleCommentsButton.textContent = isExpanded ? 'Hide comments' : 'Show comments';
      toggleCommentsButton.setAttribute('aria-expanded', String(isExpanded));
    });

    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameValue = nameInput.value.trim();
        const commentValue = commentInput.value.trim();
        if (!nameValue || !commentValue) {
            alert('Please fill in both fields with proper text.');
            return;
      }
      
        const commentElement = createCommentElement(nameValue, commentValue);
        commentList.appendChild(commentElement);
        commentForm.reset();
    });
}