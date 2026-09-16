import { getRequiredElement } from "./dom";

const SKIPPED_TAGS = [
  'SCRIPT',
  'STYLE',
  'FORM',
  'BUTTON'
];

function escapeRegExp(value: string): string {
  return value.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );
}

function clearHighlights(article: HTMLElement): void {
  const highlights = article.querySelectorAll('.highlight');
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode;
    if (!parent) {
      return;
    }
    highlight.replaceWith(document.createTextNode(highlight.textContent));
    parent.normalize();
  });
}

function highlightTextNode(node: Text, regex: RegExp): void {
  const nodeValue = node.nodeValue ?? "";
  const parts = nodeValue.split(regex);
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

function walk(node: Node, regex: RegExp): void {
  if (node instanceof Text) {
    highlightTextNode(node, regex);
    return;
  }

  if (
    node instanceof HTMLElement &&
    !SKIPPED_TAGS.includes(node.tagName) &&
    !node.hidden
  ) {
    Array.from(node.childNodes).forEach((child) => {
      walk(child, regex);
    });
  }
}

export function initSearch(): void {
  const article = getRequiredElement<HTMLElement>('article');
  const searchForm = getRequiredElement<HTMLFormElement>('.search');
  const searchInput = getRequiredElement<HTMLInputElement>(
    'input[name="q"]', searchForm
  );
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearHighlights(article);
    const searchKey = searchInput.value.trim();
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