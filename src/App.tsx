import { type ReactElement, useState } from 'react';
import type { Bear } from './scripts/types';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import BearArticle from './components/article/BearArticle';
import RelatedLinks from './components/layout/RelatedLinks';
import Footer from './components/layout/Footer';

const bears: Bear[] = [];

export default function App(): ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <>
      <Header />

      <Navigation
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      <main>
        <BearArticle bears={bears} searchQuery={searchQuery} />
        <RelatedLinks />
      </main>

      <Footer />
    </>
  );
}
