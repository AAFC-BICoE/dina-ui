import { LoadingSpinner, Tooltip } from "common-ui";
import DOMPurify from "dompurify";
import { compact } from "lodash";
import { useEffect, useState } from "react";
import useSWR from "swr";
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

  /** The value of the input element. */
  const [inputValue, setInputValue] = useState("");

  /**
   * The query passed to the Catalogue of Life API.
   * This state is only set when the user submits the search input.
   */
  const [searchValue, setSearchValue] = useState("");

  const { isValidating: colSearchIsLoading, data: searchResult } = useSWR(
    [searchValue],
    () => catalogueOfLifeSearch(searchValue, fetchJson),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  /**
   * Whether the Catalogue of Life Api is throttled
   * to make sure we don't send more requests than we are allowed to.
   */
  const [colApiRequestsOnHold, setColApiRequestsOnHold] = useState(false);
  useEffect(() => {
    if (searchValue) {
      setColApiRequestsOnHold(true);
      const timeout = setTimeout(() => setColApiRequestsOnHold(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [searchValue]);

  const suggestButtonIsDisabled =
    colApiRequestsOnHold || !inputValue || colSearchIsLoading;

  function doSearch() {
    // Set a 1-second API request throttle:
    if (suggestButtonIsDisabled) {
      return;
    }

    // Set the new search value which will make useSWR do the lookup:
    setSearchValue(inputValue);
  }

  const nameResults =
    searchResult &&
    compact([searchResult?.name, ...(searchResult?.alternatives ?? [])]);

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
      {colSearchIsLoading && <LoadingSpinner loading={true} />}
      {!!nameResults?.length && (
        <div className="list-group">
          {nameResults.map((result, index) => {
            // Use DOMPurify to sanitize against XSS when using dangerouslySetInnerHTML:
            const safeHtmlLabel: string = DOMPurify.sanitize(
              result.labelHtml + (result.id ? ` (nidx ${result.id})` : "")
            );

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
