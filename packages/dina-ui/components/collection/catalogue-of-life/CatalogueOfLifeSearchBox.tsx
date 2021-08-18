import { LoadingSpinner, Tooltip, useThrottledFetch } from "common-ui";
import DOMPurify from "dompurify";
import { compact } from "lodash";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

export interface CatalogueOfLifeSearchBoxProps {
  /** Optionally mock out the HTTP fetch for testing. */
  fetchJson?: (url: string) => Promise<any>;

  onSelect?: (selection: string | null) => void;
}

export function CatalogueOfLifeSearchBox({
  fetchJson,
  onSelect
}: CatalogueOfLifeSearchBoxProps) {
  const { formatMessage } = useDinaIntl();

  const {
    searchIsLoading,
    searchResult,
    inputValue,
    setInputValue,
    suggestButtonIsDisabled,
    doSearch
  } = useThrottledFetch({
    fetcher: searchValue => catalogueOfLifeSearch(searchValue, fetchJson),
    timeoutMs: 1000
  });

  const nameResults =
    searchResult &&
    compact([searchResult?.name, ...(searchResult?.alternatives ?? [])]).filter(
      it => !it.canonical
    );

  return (
    <div className="card card-body border mb-3">
      <div className="d-flex align-items-center mb-3">
        <label className="pt-2 d-flex align-items-center">
          <strong>
            <DinaMessage id="colSearchLabel" />
          </strong>
          <Tooltip id="colSearchBoxTooltip" />
        </label>
        <div className="flex-grow-1">
          <div className="input-group">
            <input
              aria-label={formatMessage("colSearchLabel")}
              className="form-control col-search-input"
              onChange={e => setInputValue(e.target.value)}
              onFocus={e => e.target.select()}
              onKeyDown={e => {
                if (e.keyCode === 13) {
                  e.preventDefault();
                  doSearch();
                }
              }}
              value={inputValue}
            />
            <button
              style={{ width: "10rem" }}
              onClick={doSearch}
              className="btn btn-primary ms-auto col-search-button"
              type="button"
              disabled={suggestButtonIsDisabled}
            >
              <DinaMessage id="searchButton" />
            </button>
          </div>
        </div>
      </div>
      {searchIsLoading && <LoadingSpinner loading={true} />}
      {!!nameResults?.length && (
        <div className="list-group">
          {nameResults.map((result, index) => {
            // Use DOMPurify to sanitize against XSS when using dangerouslySetInnerHTML:
            const safeHtmlLabel: string = DOMPurify.sanitize(result.labelHtml);

            return (
              <div
                key={result.id ?? index}
                className="list-group-item list-group-item-action d-flex"
              >
                <div className="flex-grow-1 d-flex align-items-center col-search-result-label">
                  <span dangerouslySetInnerHTML={{ __html: safeHtmlLabel }} />
                </div>
                <button
                  type="button"
                  className="btn btn-primary col-name-select-button"
                  style={{ width: "8rem" }}
                  onClick={() => {
                    const element = document.createElement("div");
                    element.innerHTML = safeHtmlLabel;
                    const plainTextLabel = element.textContent;
                    onSelect?.(plainTextLabel);
                  }}
                >
                  <DinaMessage id="select" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {nameResults?.length === 0 && (
        <p>
          <DinaMessage id="noResultsFound" />
        </p>
      )}
    </div>
  );
}

export interface CatalogueOfLifeNameSearchResult {
  name?: CatalogueOfLifeName;
  type?: string;
  alternatives?: CatalogueOfLifeName[];
  nameKey?: number;
}

export interface CatalogueOfLifeName {
  created?: string;
  modified?: string;
  canonicalId?: number;
  scientificName?: string;
  rank?: string;
  genus?: string;
  specificEpithet?: string;
  labelHtml?: string;
  parsed?: true;
  id?: number;
  authorship?: string;
  canonical?: boolean;
  combinationAuthorship?: {
    authors?: string[];
  };
}

async function catalogueOfLifeSearch(
  searchValue: string,
  fetchJson: (url: string) => Promise<any> = urlArg =>
    window.fetch(urlArg).then(res => res.json())
): Promise<CatalogueOfLifeNameSearchResult | null> {
  if (!searchValue?.trim()) {
    return null;
  }

  const url = new URL("https://api.catalogueoflife.org/nidx/match");
  url.search = new URLSearchParams({
    q: searchValue,
    verbose: "true"
  }).toString();

  try {
    const response = await fetchJson(url.toString());

    if (response.error) {
      throw new Error(String(response.error));
    }

    // Search API returns an array ; Reverse API returns a single place:
    return response as CatalogueOfLifeNameSearchResult;
  } catch (error) {
    console.error(error);
    return {};
  }
}
