import type { ReactElement } from 'react';
import { Link } from 'react-router';
import SearchForm from '../search/SearchForm';

interface NavigationProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  anonymous: boolean;
}

export default function Navigation({
  searchQuery,
  onSearchQueryChange,
  anonymous,
}: NavigationProps): ReactElement {
  return (
    <nav className="nav">
      <ul>
        <li>
          <Link to="/bears">Home</Link>
        </li>
        {anonymous && (
          <>
            <li>
              <Link to="/login">Log in</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
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
