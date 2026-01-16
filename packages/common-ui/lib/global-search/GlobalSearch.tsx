import { useState, FormEvent, useEffect } from "react";
import { useIntl } from "react-intl";
import "./global-search.css";

export interface GlobalSearchProps {
  /** Callback function when search is submitted */
  onSearch: (searchTerm: string) => void;
  /** Optional CSS class name */
  className?: string;
  /** Whether the search is currently loading */
  pending?: boolean;
  /** Controlled search term value */
  searchTerm?: string;
}

export function GlobalSearch({
  onSearch,
  className = "",
  searchTerm: searchProp,
  pending = false
}: GlobalSearchProps) {
  const { formatMessage } = useIntl();
  const [searchTerm, setSearchTerm] = useState(searchProp || "");

  // Sync with external searchTerm prop changes
  useEffect(() => {
    if (searchProp !== undefined && searchProp !== searchTerm) {
      setSearchTerm(searchProp);
    }
  }, [searchProp, searchTerm]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <div className={`global-search-container ${className}`}>
      <form onSubmit={handleSubmit} className="global-search-form">
        <input
          type="text"
          className="global-search-input"
          placeholder={formatMessage({ id: "searchDinaPlaceholder" })}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={pending}
        />
        <button
          type="submit"
          className="global-search-button"
          disabled={pending || !searchTerm.trim()}
        >
          <svg
            className="global-search-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      </form>
    </div>
  );
}
