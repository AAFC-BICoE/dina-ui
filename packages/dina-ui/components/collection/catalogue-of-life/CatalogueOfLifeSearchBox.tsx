import {
  FormikButton,
  LoadingSpinner,
  Tooltip,
  useThrottledFetch
} from "common-ui";
import { useState, ReactNode } from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { DataSetResult } from "./dataset-search-types";
import { NameUsageSearchResult } from "./nameusage-types";
import DOMPurify from "dompurify";
import { Field } from "formik";

export interface CatalogueOfLifeSearchBoxProps {
  /** Optionally mock out the HTTP fetch for testing. */
  fetchJson?: (url: string) => Promise<any>;

  onSelect?: (selection: string | null) => void;

  /** The determination index within the material sample. */
  index?: number;
}

export function CatalogueOfLifeSearchBox({
  fetchJson,
  onSelect,
  index
}: CatalogueOfLifeSearchBoxProps) {
  const { formatMessage } = useDinaIntl();

  const [dataSet, setDataSet] = useState<DataSetResult>({
    title: "Catalogue of Life Checklist",
    key: 2328
  });

  const {
    searchIsLoading,
    searchResult,
    inputValue,
    setInputValue,
    searchIsDisabled,
    doThrottledSearch
  } = useThrottledFetch({
    fetcher: searchValue =>
      catalogueOfLifeQuery<NameUsageSearchResult>({
        url: `https://api.catalogueoflife.org/dataset/${dataSet.key}/nameusage`,
        params: {
          q: searchValue
        },
        searchValue,
        fetchJson
      }),
    timeoutMs: 1000
  });

  const nameResults = searchResult?.result;

  return (
    <div className="card card-body border">
      {/* Hide this for now for the demo */}
      {/* <div className="d-flex align-items-center mb-3">
        <label className="pt-2 d-flex align-items-center">
          <strong>
            <DinaMessage id="dataset" />
          </strong>
          <Tooltip id="datasetSearchTooltip" />
        </label>
        <div className="flex-grow-1">
          <ColDataSetDropdown
            onChange={setDataSet}
            value={dataSet}
            fetchJson={fetchJson}
          />
        </div>
      </div> */}
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
                  doThrottledSearch(inputValue);
                }
              }}
              value={inputValue}
            />
            <button
              style={{ width: "10rem" }}
              onClick={doThrottledSearch}
              className="btn btn-primary ms-auto col-search-button"
              type="button"
              disabled={searchIsDisabled}
            >
              <DinaMessage id="searchButton" />
            </button>
          </div>
        </div>
      </div>
      <Field>
        {({ form: { values: formState } }) => {
          const materialSample = formState;
          const verbatimScientificName =
            materialSample.determination?.[index ?? 0]?.verbatimScientificName;
          const hasVerbatimScientificName = !!verbatimScientificName;
          return (
            hasVerbatimScientificName && (
              <div className="d-flex align-items-center mb-3">
                <div className="pe-3">
                  <DinaMessage id="search" />:
                </div>
                <FormikButton
                  className="btn btn-link"
                  onClick={() => doThrottledSearch(verbatimScientificName)}
                >
                  <DinaMessage id="field_verbatimScientificName" />
                </FormikButton>
              </div>
            )
          );
        }}
      </Field>
      {searchIsLoading && <LoadingSpinner loading={true} />}
      {!!nameResults?.length && (
        <div className="list-group">
          {nameResults.map((result, idx) => {
            const link = document.createElement("a");
            link.setAttribute(
              "href",
              `https://data.catalogueoflife.org/dataset/${dataSet.key}/name/${result.name?.id}`
            );
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener");

            link.innerHTML = result.labelHtml ?? String(result);

            // Use DOMPurify to sanitize against XSS when using dangerouslySetInnerHTML:
            const safeHtmlLink: string = DOMPurify.sanitize(link.outerHTML, {
              ADD_ATTR: ["target", "rel"]
            });
            return (
              <div
                key={result.id ?? idx}
                className="list-group-item list-group-item-action d-flex"
              >
                <div className="flex-grow-1 d-flex align-items-center col-search-result-label">
                  <span dangerouslySetInnerHTML={{ __html: safeHtmlLink }} />
                </div>
                <FormikButton
                  className="btn btn-primary col-name-select-button"
                  buttonProps={() => ({ style: { width: "8rem" } })}
                  onClick={() => onSelect?.(safeHtmlLink)}
                >
                  <DinaMessage id="select" />
                </FormikButton>
              </div>
            );
          })}
        </div>
      )}
      {searchResult?.empty && (
        <p>
          <DinaMessage id="noResultsFound" />
        </p>
      )}
    </div>
  );
}
export interface CatalogueOfLifeSearchParams {
  url: string;
  params: Record<string, string>;
  searchValue: string;
  fetchJson?: (url: string) => Promise<any>;
}

export async function catalogueOfLifeQuery<T>({
  url,
  params,
  searchValue,
  fetchJson = urlArg => window.fetch(urlArg).then(res => res.json())
}: CatalogueOfLifeSearchParams): Promise<T | null> {
  if (!searchValue?.trim()) {
    return null;
  }

  const urlObject = new URL(url);
  urlObject.search = new URLSearchParams(params).toString();

  try {
    const response = await fetchJson(urlObject.toString());

    if (response.error) {
      throw new Error(String(response.error));
    }

    // Search API returns an array ; Reverse API returns a single place:
    return response as T;
  } catch (error) {
    console.error(error);
    return null;
  }
}
