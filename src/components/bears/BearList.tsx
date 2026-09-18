import type { ReactElement } from 'react';
import type { Bear } from '../../scripts/types';
import BearCard from './BearCard';

interface BearListProps {
  bears: Bear[];
  searchQuery: string;
}

export default function BearList({
  bears,
  searchQuery,
}: BearListProps): ReactElement {
  return (
    <section className="more-bears">
      <h3>More Bears</h3>

      <div className="bear-list">
        {bears.map((bear) => (
          <BearCard key={bear.binomial} bear={bear} searchQuery={searchQuery} />
        ))}
      </div>
    </section>
  );
}
