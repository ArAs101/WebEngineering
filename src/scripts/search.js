const SKIPPED_TAGS = [
  'SCRIPT',
  'STYLE',
  'FORM',
  'BUTTON'
];

function escapeRegExp(value) {
  return value.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );
}

function clearHighlights(article) {
  const highlights = article.querySelectorAll('.highlight');
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode;
    highlight.replaceWith(document.createTextNode(highlight.textContent));
    parent.normalize();
  });
}

function highlightTextNode(node, regex) {
  const parts = node.nodeValue.split(regex);
  if (parts.length === 1) return;
  const fragment = document.createDocumentFragment();
  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      const mark = document.createElement('mark');
      mark.className = 'highlight';
      mark.textContent = part;
      fragment.append(mark);
    } else {
      fragment.append(document.createTextNode(part));
    }
  });

  node.replaceWith(fragment);
}

function walk(node, regex) {
  if (node.nodeType === Node.TEXT_NODE) {
    highlightTextNode(node, regex);
    return;
  }

  if (
    node.nodeType === Node.ELEMENT_NODE &&
    !SKIPPED_TAGS.includes(node.tagName) &&
    !node.hidden
  ) {
    Array.from(node.childNodes).forEach((child) => {
      walk(child, regex);
    });
  }
}

export function initSearch() {
  const article = document.querySelector('article');
  const searchForm = document.querySelector('.search');
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearHighlights(article);
    const searchKey = event.currentTarget.elements.q.value.trim();
    if (!searchKey) {
      return;
    }
    const regex = new RegExp(
      '(' + escapeRegExp(searchKey) + ')',
      'gi'
    );
    walk(article, regex);
  });
}