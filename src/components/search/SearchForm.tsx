import type { ReactElement } from 'react';

export default function SearchForm(): ReactElement {
  return (
    <form className="search">
      <input type="search" name="q" placeholder="Search query" />
      <input type="submit" value="Go!" />
    </form>
  );
}
