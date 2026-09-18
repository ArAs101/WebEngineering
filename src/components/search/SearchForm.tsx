import { useEffect, useState, type FormEvent, type ReactElement } from 'react';

interface SearchFormProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export default function SearchForm({
  searchQuery,
  onSearchQueryChange,
}: SearchFormProps): ReactElement {
  const [inputValue, setInputValue] = useState(searchQuery);
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSearchQueryChange(inputValue.trim());
  }

  return (
    <form className="search" onSubmit={handleSubmit}>
      <input
        type="search"
        name="q"
        placeholder="Search query"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
        }}
      />
      <input type="submit" value="Go!" />
    </form>
  );
}
