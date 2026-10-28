import { type ReactElement, useEffect, useState } from 'react';
import type { BearLoadState } from './scripts/types';
import { loadBears } from './scripts/bearService';
import { Navigate, Route, Routes, useSearchParams } from 'react-router';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';
import BearListPage from './pages/BearListPage';
import BearDetailPage from './pages/BearDetailPage';

export default function App(): ReactElement {
  const [bearLoadState, setBearLoadState] = useState<BearLoadState>({
    status: 'loading',
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';

  function handleSearchQueryChange(query: string): void {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (query === '') {
      nextSearchParams.delete('q');
    } else {
      nextSearchParams.set('q', query);
    }
    setSearchParams(nextSearchParams);
  }

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
        onSearchQueryChange={handleSearchQueryChange}
      />

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/bears" replace />} />

          <Route
            path="/bears"
            element={
              <BearListPage
                bearLoadState={bearLoadState}
                searchQuery={searchQuery}
              />
            }
          />

          <Route
            path="/bears/:bearId"
            element={
              <BearDetailPage
                bearLoadState={bearLoadState}
                searchQuery={searchQuery}
              />
            }
          />
        </Routes>
      </main>

      <Footer />
    </>
  );
}
