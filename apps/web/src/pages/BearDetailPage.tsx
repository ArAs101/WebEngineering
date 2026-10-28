import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router';
import type { BearLoadState } from '../scripts/types';
import RelatedLinks from '../components/layout/RelatedLinks';
import HighlightedText from '../components/search/HighlightedText';

interface BearDetailPageProps {
  bearLoadState: BearLoadState;
  searchQuery: string;
}

export default function BearDetailPage({
  bearLoadState,
  searchQuery,
}: BearDetailPageProps): ReactElement {
  const { bearId } = useParams<{ bearId: string }>();
  const listUrl =
    searchQuery === ''
      ? '/bears'
      : `/bears?q=${encodeURIComponent(searchQuery)}`;

  if (bearLoadState.status === 'loading') {
    return (
      <article>
        <p>Loading bear...</p>
      </article>
    );
  }

  if (bearLoadState.status === 'empty') {
    return (
      <article>
        <p>No bears found.</p>
      </article>
    );
  }

  if (bearLoadState.status === 'error') {
    return (
      <article>
        <p className="bear-error" role="alert">
          Could not load bear: {bearLoadState.message}
        </p>
      </article>
    );
  }

  const bear = bearLoadState.bears.find(
    (candidate) => candidate.binomial === bearId
  );

  if (bear === undefined) {
    return (
      <article>
        <h2>Bear not found</h2>
        <p>The requested bear does not exist.</p>
        <Link to="/bears">Back to all bears</Link>
      </article>
    );
  }

  return (
    <>
      <article>
        <Link to={listUrl}>Back to all bears</Link>

        <h2>
          <HighlightedText text={bear.name} query={searchQuery} />
        </h2>

        <img
          src={bear.image}
          alt={`Image of ${bear.name}`}
          className="bear-image"
        />

        <p>
          Scientific name:{' '}
          <HighlightedText text={bear.binomial} query={searchQuery} />
        </p>

        <p>
          Range: <HighlightedText text={bear.range} query={searchQuery} />
        </p>
      </article>

      <RelatedLinks />
    </>
  );
}
