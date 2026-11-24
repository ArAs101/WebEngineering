import { Link } from 'react-router';
import type { ReactElement } from 'react';
import type { Bear } from '../../scripts/types';
import HighlightedText from '../search/HighlightedText';
import { showBearPlaceholder } from '../../scripts/bearService';

interface BearCardProps {
  bear: Bear;
  searchQuery: string;
}

export default function BearCard({
  bear,
  searchQuery,
}: BearCardProps): ReactElement {
  const encodedBearId = encodeURIComponent(bear.id);
  const detailUrl =
    searchQuery === ''
      ? `/bears/${encodedBearId}`
      : `/bears/${encodedBearId}?q=${encodeURIComponent(searchQuery)}`;
  return (
    <div className="bear">
      <img
        src={bear.image}
        onError={showBearPlaceholder}
        alt={`Image of ${bear.name}`}
        className="bear-image"
      />

      <p>
        <b>
          <Link to={detailUrl}>
            <HighlightedText text={bear.name} query={searchQuery} />
          </Link>
        </b>{' '}
        (
        <HighlightedText text={bear.binomial} query={searchQuery} />)
      </p>

      <p>
        Range: <HighlightedText text={bear.range} query={searchQuery} />
      </p>
    </div>
  );
}
