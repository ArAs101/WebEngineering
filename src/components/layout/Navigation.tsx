import type { ReactElement } from 'react';
import SearchForm from '../search/SearchForm';

interface NavigationProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export default function Navigation({
  searchQuery,
  onSearchQueryChange,
}: NavigationProps): ReactElement {
  return (
    <nav className="nav">
      <ul>
        <li>
          <a href="#">Home</a>
        </li>
        <li>
          <a href="#">Our team</a>
        </li>
        <li>
          <a href="#">Projects</a>
        </li>
        <li>
          <a href="#">Blog</a>
        </li>
      </ul>

      <SearchForm
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
      />
    </nav>
  );
}
