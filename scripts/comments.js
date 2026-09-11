function createCommentElement(name, comment) {
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

export function initComments() {
    // Show/hide comments toggle
    const toggleCommentsButton = document.querySelector('.comments-toggle');
    const commentWrapper = document.querySelector('.comment-wrapper');
    // Comment form stuff
    const commentForm = document.querySelector('.comment-form');
    const nameInput = document.querySelector('#name');
    const commentInput = document.querySelector('#comment');
    const commentList = document.querySelector('.comment-container');
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