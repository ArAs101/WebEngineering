import type { ReactElement } from 'react';
import type { BearLoadState } from '../../scripts/types';
import BearCard from './BearCard';

interface BearListProps {
  bearLoadState: BearLoadState;
  searchQuery: string;
}

export default function BearList({
  bearLoadState,
  searchQuery,
}: BearListProps): ReactElement {
  return (
    <section className="more-bears">
      <h3>More Bears</h3>

      {bearLoadState.status === 'loading' && <p>Loading bears...</p>}

      {bearLoadState.status === 'empty' && <p>No bears found.</p>}

      {bearLoadState.status === 'error' && (
        <p className="bear-error" role="alert">
          Could not load bears: {bearLoadState.message}
        </p>
      )}

      {bearLoadState.status === 'success' && (
        <div className="bear-list">
          {bearLoadState.bears.map((bear) => (
            <BearCard
              key={bear.binomial}
              bear={bear}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </section>
  );
}
