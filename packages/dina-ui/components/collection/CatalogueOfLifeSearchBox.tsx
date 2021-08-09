import { LoadingSpinner, Tooltip } from "common-ui";
import { compact } from "lodash";
import { useState } from "react";
import useSWR from "swr";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import DOMPurify from "dompurify";

export interface CatalogueOfLifeSearchBoxProps {
  /** Optionally mock out the HTTP fetch for testing. */
  fetchJson?: (url: string) => Promise<any>;
}

export function CatalogueOfLifeSearchBox({
  fetchJson
}: CatalogueOfLifeSearchBoxProps) {
  const { formatMessage } = useDinaIntl();

  /** The value of the input element. */
  const [inputValue, setInputValue] = useState("");

  /**
   * The query passed to the Catalogue of Life API.
   * This state is only set when the user submits the search input.
   */
  const [searchValue, setSearchValue] = useState("");

  /**
   * Whether the Catalogue of Life Api is on hold
   * to make sure we don't send more requests than we are allowed to.
   */
  const [colApiRequestsOnHold, setColApiRequestsOnHold] = useState(false);

  const { isValidating: colSearchIsLoading, data: searchResult } = useSWR(
    [searchValue],
    () => catalogueOfLifeSearch(searchValue, fetchJson),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  const suggestButtonIsDisabled =
    colApiRequestsOnHold || !inputValue || colSearchIsLoading;

  function doSearch() {
    // Set a 1-second API request throttle:
    if (suggestButtonIsDisabled) {
      return;
    }
    setColApiRequestsOnHold(true);
    setTimeout(() => setColApiRequestsOnHold(false), 1000);

    // Set the new search value which will make useSWR do the lookup:
    setSearchValue(inputValue);
  }

  const nameResults =
    searchResult &&
    compact([
      searchResult?.name,
      ...(searchResult?.alternatives ?? [])
      // Only include results with authorship:
    ]).filter(it => it.authorship);

  return (
    <div className="card card-body border mb-3" style={{ maxWidth: "40rem" }}>
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
              aria-label={formatMessage("locationLabel")}
              className="form-control"
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
          {nameResults.map((result, index) => (
            <div
              key={result.id ?? index}
              className="list-group-item list-group-item-action d-flex"
            >
              <div className="flex-grow-1 d-flex align-items-center">
                <span
                  dangerouslySetInnerHTML={{
                    // Use DOMPurify to sanitize against XSS when using dangerouslySetInnerHTML:
                    __html: DOMPurify.sanitize(result.labelHtml)
                  }}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "8rem" }}
              >
                <DinaMessage id="select" />
              </button>
            </div>
          ))}
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

interface CatalogueOfLifeNameSearchResult {
  name?: CatalogueOfLifeName;
  type?: string;
  alternatives?: CatalogueOfLifeName[];
  nameKey?: string;
}

interface CatalogueOfLifeName {
  created?: string;
  modified?: string;
  canonicalId?: number;
  scientificName?: string;
  rank?: string;
  genus?: string;
  specificEpithet?: string;
  canonical?: true;
  labelHtml?: string;
  parsed?: true;
  id?: number;
  authorship?: string;
}

async function catalogueOfLifeSearch(
  searchValue: string,
  fetchJson: (url: string) => Promise<any> = urlArg =>
    window.fetch(urlArg).then(res => res.json())
): Promise<CatalogueOfLifeNameSearchResult | null> {
  if (!searchValue?.trim()) {
    return null;
  }

  const url = new URL(`https://api.catalogueoflife.org/name/matching`);
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
