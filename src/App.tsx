import { type ReactElement, useEffect, useState } from 'react';
import type { BearLoadState } from './scripts/types';
import { loadBears } from './scripts/bearService';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import BearArticle from './components/article/BearArticle';
import RelatedLinks from './components/layout/RelatedLinks';
import Footer from './components/layout/Footer';

export default function App(): ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [bearLoadState, setBearLoadState] = useState<BearLoadState>({
    status: 'loading',
  });

  useEffect(() => {
    let requestIsCurrent = true;
    async function fetchBears(): Promise<void> {
      setBearLoadState({ status: 'loading' });
      try {
        const bears = await loadBears();
        if (!requestIsCurrent) {
          return;
        }
        if (bears.length === 0) {
          setBearLoadState({ status: 'empty' });
          return;
        }

        setBearLoadState({ status: 'success', bears });
      } catch (error: unknown) {
        if (!requestIsCurrent) {
          return;
        }
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred.';
        setBearLoadState({ status: 'error', message });
      }
    }

    void fetchBears();
    return () => {
      requestIsCurrent = false;
    };
  }, []);

  return (
    <>
      <Header />

      <Navigation
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      <main>
        <BearArticle bearLoadState={bearLoadState} searchQuery={searchQuery} />
        <RelatedLinks />
      </main>

      <Footer />
    </>
  );
}
