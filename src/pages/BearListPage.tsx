import type { ReactElement } from 'react';
import type { BearLoadState } from '../scripts/types';
import BearArticle from '../components/article/BearArticle';
import RelatedLinks from '../components/layout/RelatedLinks';

interface BearListPageProps {
  bearLoadState: BearLoadState;
  searchQuery: string;
}

export default function BearListPage({
  bearLoadState,
  searchQuery,
}: BearListPageProps): ReactElement {
  return (
    <>
      <BearArticle bearLoadState={bearLoadState} searchQuery={searchQuery} />
      <RelatedLinks />
    </>
  );
}
