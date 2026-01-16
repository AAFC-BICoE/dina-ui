import {
  GlobalSearch,
  LoadingSpinner,
  useMultiIndexSearch,
  SearchResultTabs,
  SearchResultItem,
  getIndexConfig,
  SEARCH_INDEXES
} from "common-ui";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Alert from "react-bootstrap/Alert";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export default function GlobalSearchResultPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const searchQuery = (router.query.q as string) || "";
  const [activeTab, setActiveTab] = useState("all");

  // Initialize multi-index search
  const { handleSearch, searchTerm, searchResult, pending, error } =
    useMultiIndexSearch({
      initialSearchTerm: searchQuery
    });

  // When the URL query parameter changes, update the search
  useEffect(() => {
    if (searchQuery && searchQuery !== searchTerm) {
      handleSearch(searchQuery);
    }
  }, [searchQuery, searchTerm, handleSearch]);

  // Handle new search from the search box
  const onSearch = (term: string) => {
    // Reset to "all" tab on new search
    setActiveTab("all");
    // Update URL without navigation
    router.push(`/global-search?q=${encodeURIComponent(term)}`, undefined, {
      shallow: true
    });
    handleSearch(term);
  };

  // Build tabs data
  const tabs = [
    {
      key: "all",
      label: formatMessage("allResults"),
      count: searchResult?.totalCount || 0
    },
    ...SEARCH_INDEXES.map((config) => {
      const indexResult = searchResult?.indexResults.find((ir) =>
        ir.indexName.startsWith(config.indexName)
      );
      return {
        key: config.indexName,
        label: config.name,
        count: indexResult?.count || 0
      };
    })
  ];

  // Get filtered results based on active tab
  const getFilteredResults = () => {
    if (!searchResult) return [];

    if (activeTab === "all") {
      // Show all results grouped by index
      return searchResult.indexResults;
    } else {
      // Show results for specific index
      const indexResult = searchResult.indexResults.find((ir) =>
        ir.indexName.startsWith(activeTab)
      );
      return indexResult ? [indexResult] : [];
    }
  };

  const filteredResults = getFilteredResults();

  return (
    <div>
      <Head title={formatMessage("globalSearchResults")} />
      <Nav />
      <main role="main">
        <Container fluid={true} className="py-4">
          {/* Search Box - Centered at 80% width */}
          <div className="d-flex justify-content-center mb-4">
            <div style={{ width: "80%" }}>
              <GlobalSearch
                onSearch={onSearch}
                pending={pending}
                searchTerm={searchTerm}
              />
            </div>
          </div>

          {/* Search Results Header */}
          {searchTerm && !pending && searchResult && (
            <>
              <h3 className="mb-2">
                {formatMessage("searchResultsFor", { searchTerm })}
              </h3>
              <div className="mb-3 text-muted">
                {formatMessage("resultsFound", {
                  count: searchResult.totalCount
                })}
              </div>
            </>
          )}

          {/* Tabs */}
          {searchResult && searchResult.totalCount > 0 && (
            <SearchResultTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}

          {/* Loading State */}
          {pending && (
            <div className="text-center my-5">
              <LoadingSpinner loading={true} />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="danger">
              <DinaMessage id="searchErrorMessage" />:{" "}
              {error.message || "Unknown error"}
            </Alert>
          )}

          {/* No Results */}
          {!pending && searchResult && searchResult.totalCount === 0 && (
            <Alert variant="info">
              <DinaMessage id="noSearchResults" />
            </Alert>
          )}

          {/* Top Matches (only on "All Results" tab) */}
          {!pending &&
            searchResult &&
            activeTab === "all" &&
            searchResult.topMatches.length > 0 && (
              <div className="mb-5">
                <h4 className="mb-3">{formatMessage("topMatches")}</h4>
                {searchResult.topMatches.map((hit, index) => (
                  <SearchResultItem key={`top-${index}`} hit={hit} />
                ))}
              </div>
            )}

          {/* Results by Index */}
          {!pending &&
            filteredResults.map((indexResult) => {
              const config = getIndexConfig(indexResult.indexName);
              if (!config || indexResult.topHits.length === 0) return null;

              return (
                <div key={indexResult.indexName} className="mb-5">
                  <h4 className="mb-3">{config.name}</h4>
                  {indexResult.topHits.map((hit, index) => (
                    <SearchResultItem
                      key={`${indexResult.indexName}-${index}`}
                      hit={hit}
                      showIcon={activeTab === "all"}
                    />
                  ))}
                </div>
              );
            })}

          {/* Empty State */}
          {!pending && !searchResult && !error && (
            <Alert variant="info">
              <DinaMessage id="enterSearchTerm" />
            </Alert>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
