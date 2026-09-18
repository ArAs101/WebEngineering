import type { ReactElement } from 'react';
import type { Bear } from '../../scripts/types';

interface BearCardProps {
  bear: Bear;
}

export default function BearCard({ bear }: BearCardProps): ReactElement {
  return (
    <div className="bear">
      <img
        src={bear.image}
        alt={`Image of ${bear.name}`}
        className="bear-image"
      />

      <p>
        <b>{bear.name}</b> ({bear.binomial})
      </p>

      <p>Range: {bear.range}</p>
    </div>
  );
}
