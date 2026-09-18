import { Fragment, type ReactElement } from 'react';

interface HighlightedTextProps {
  text: string;
  query: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function HighlightedText({
  text,
  query,
}: HighlightedTextProps): ReactElement {
  const normalizedQuery = query.trim();

  if (normalizedQuery === '') {
    return <>{text}</>;
  }

  const expression = new RegExp(`(${escapeRegExp(normalizedQuery)})`, 'gi');

  const parts = text.split(expression);

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === normalizedQuery.toLowerCase() ? (
          <span className="highlight" key={`${index}-${part}`}>
            {part}
          </span>
        ) : (
          <Fragment key={`${index}-${part}`}>{part}</Fragment>
        )
      )}
    </>
  );
}
