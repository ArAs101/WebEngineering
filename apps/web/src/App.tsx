import { type ReactElement, useEffect, useState } from 'react';
import type { BearLoadState } from './scripts/types';
import { loadBears } from './scripts/bearService';
import {
  Navigate,
  Route,
  Routes,
  useMatch,
  useSearchParams,
} from 'react-router';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';
import BearListPage from './pages/BearListPage';
import BearDetailPage from './pages/BearDetailPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import {
  getCurrentUser,
  logoutUser,
  type PublicUser,
} from './scripts/authService';

export default function App(): ReactElement {
  const [user, setUser] = useState<PublicUser | null | undefined>(undefined);
  const [accountError, setAccountError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void getCurrentUser(controller.signal)
      .then((account) => {
        if (!controller.signal.aborted) setUser(account);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setAccountError(
            error instanceof Error ? error.message : 'Could not load account.'
          );
          setUser(null);
        }
      });
    return () => {
      controller.abort();
    };
  }, []);

  function handleLogin(account: PublicUser): void {
    setAccountError('');
    setUser(account);
  }

  async function handleLogout(): Promise<void> {
    setLoggingOut(true);
    setAccountError('');
    try {
      await logoutUser();
      setUser(null);
    } catch (error: unknown) {
      setAccountError(
        error instanceof Error ? error.message : 'Logout failed.'
      );
    } finally {
      setLoggingOut(false);
    }
  }

  const [bearLoadState, setBearLoadState] = useState<BearLoadState>({
    status: 'loading',
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';
  const isBearDetail = useMatch('/bears/:bearId') !== null;
  const bearNameFilter = isBearDetail ? '' : searchQuery.trim();

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
        const bears = await loadBears(bearNameFilter);
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
  }, [bearNameFilter]);

  return (
    <>
      <Header />

      <Navigation
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        anonymous={user === null}
      />

      {user != null && (
        <div className="account-status">
          <span>Signed in as {user.email}</span>
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => {
              void handleLogout();
            }}
          >
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      )}
      {accountError !== '' && <p role="alert">{accountError}</p>}

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/bears" replace />} />

          <Route
            path="/login"
            element={
              user === undefined ? (
                <p role="status">Checking your session…</p>
              ) : user === null ? (
                <LoginPage onLogin={handleLogin} />
              ) : (
                <Navigate to="/bears" replace />
              )
            }
          />

          <Route path="/register" element={<RegisterPage />} />

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
                user={user}
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
