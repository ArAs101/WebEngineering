import type { ReactElement } from 'react';
import type { Bear } from '../../scripts/types';
import BearCard from './BearCard';

interface BearListProps {
  bears: Bear[];
}

export default function BearList({ bears }: BearListProps): ReactElement {
  return (
    <section className="more-bears">
      <h3>More Bears</h3>

      <div className="bear-list">
        {bears.map((bear) => (
          <BearCard key={bear.binomial} bear={bear} />
        ))}
      </div>
    </section>
  );
}
