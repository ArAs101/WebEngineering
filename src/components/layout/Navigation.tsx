import type { ReactElement } from 'react';
import SearchForm from '../search/SearchForm';

export default function Navigation(): ReactElement {
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

      <SearchForm />
    </nav>
  );
}
