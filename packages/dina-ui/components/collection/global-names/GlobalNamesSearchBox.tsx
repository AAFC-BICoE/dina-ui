import React, { useEffect } from "react";
import {
  FormikButton,
  LoadingSpinner,
  useThrottledFetch,
  useInstanceContext,
  Tooltip
} from "common-ui";
import DOMPurify from "dompurify";
import { Field, FormikProps } from "formik";
import moment from "moment";
import { ScientificNameSourceDetails } from "../../../../dina-ui/types/collection-api/resources/Determination";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  GlobalNamesSearchResult,
  GlobalNamesDatasetsResult
} from "./global-names-search-result-type";
import Select from "react-select";
import { useLocalStorage } from "@rehooks/local-storage";
import { FaExclamationCircle } from "react-icons/fa";

export type Selection =
  | string
  | boolean
  | ScientificNameSourceDetails
  | undefined;

export interface GlobalNamesSearchBoxProps {
  /** Optionally mock out the HTTP fetch for testing. */
  fetchJson?: (url: string) => Promise<any>;

  onSelect?: (selection: Selection[]) => void;

  /** The determination index within the material sample. */
  index?: number;

  setValue?: (newValue: any) => void;

  /** user entered initial search value. */
  initSearchValue?: string;

  onChange?: (selection: string | null, formik: FormikProps<any>) => void;

  formik?: FormikProps<any>;

  isDetermination?: boolean;

  /** Mock this out in tests so it gives a predictable value. */
  dateSupplier?: () => string;
}

export interface Option {
  label: string;
  value: number;
}

export function GlobalNamesSearchBox({
  fetchJson,
  onSelect,
  index,
  setValue,
  initSearchValue,
  onChange,
  formik,
  isDetermination,
  dateSupplier = () => moment().format("YYYY-MM-DD") // Today
}: GlobalNamesSearchBoxProps) {
  const { formatMessage } = useDinaIntl();
  const instanceContext = useInstanceContext();
  const scientificNamesSearchEndpoint: string =
    instanceContext?.scientificNamesSearchEndpoint ??
    "https://verifier.globalnames.org/api/v1/verifications/";
  const scientificNamesDatasetsEndpoint: string =
    instanceContext?.scientificNamesDatasetsEndpoint ??
    "https://verifier.globalnames.org/api/v1/data_sources";

  const [datasetOptions, datassetDatasetOptionsetOptions] = useLocalStorage<
    Option[]
  >("scientificNameDatasets", []);
  const [lastUpdated, setLastUpdated] = useLocalStorage<number>(
    "scientificNameDatasetsLastUpdated"
  );
  const datasetsCacheDuration = 86_400_000; // 24 hours in milliseconds
  const [selectedDatasets, setSelectedDatasets] = useLocalStorage<Option[]>(
    "scientificNameSelectedNameDatasets"
  );

  // the default value for selectedDatasets will be set below
  useEffect(() => {
    let isCancelled = false; // prevent setting state if unmounted

    const fetchNameDatasets = async () => {
      try {
        const nameDatasetsResponse = await globalNamesSourcesQuery<
          GlobalNamesDatasetsResult[]
        >({
          url: `${scientificNamesDatasetsEndpoint}`,
          fetchJson
        });
        if (!isCancelled && nameDatasetsResponse) {
          const selectOptions = nameDatasetsResponse.map((name) => {
            return {
              value: name.id,
              label:
                name.titleShort && name.titleShort.trim() !== ""
                  ? name.titleShort
                  : name.title,
              taxonData: name.hasTaxonData
            };
          });
          datassetDatasetOptionsetOptions(selectOptions);
          setLastUpdated(Date.now());
          if (selectedDatasets === undefined) {
            // Set a default value when local storage value is empty
            // NOTE: value with index 0 usually defaults to Catalogue of Life
            setSelectedDatasets([selectOptions[0]]);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Fetch error:", error);
        }
      }
    };

    if (
      datasetOptions.length === 0 ||
      !lastUpdated ||
      Date.now() - lastUpdated > datasetsCacheDuration
    ) {
      fetchNameDatasets();
    }

    return () => {
      isCancelled = true; // cleanup if component unmounts
    };
  }, []);

  const CustomDataSourceOption = (props) => {
    const { data, innerRef, innerProps } = props;

    return (
      <div
        ref={innerRef}
        {...innerProps}
        className="d-flex align-items-center p-2 dropdown-item"
        style={{ cursor: "pointer" }}
      >
        <span
          className="flex-fill text-truncate"
          style={{ marginRight: "8px" }}
        >
          {data.label}
        </span>
        {!data.taxonData && (
          <Tooltip
            id={"dataSourceHasNoTaxonData"}
            placement="left"
            disableSpanMargin={true}
            className="flex-shrink-0"
            visibleElement={<FaExclamationCircle className="text-warning" />}
          />
        )}
      </div>
    );
  };

  const {
    searchIsLoading,
    searchResult,
    inputValue,
    setInputValue,
    searchIsDisabled,
    doThrottledSearch
  } = useThrottledFetch({
    fetcher: (searchValue) => {
      searchValue = searchValue.replace(/\s+/g, " ").trim();
      return globalNamesQuery<GlobalNamesSearchResult[]>({
        url: `${scientificNamesSearchEndpoint}${
          searchValue[0].toUpperCase() + searchValue.substring(1)
        }`,
        params: {
          capitalize: "false",
          data_sources: selectedDatasets
            ? selectedDatasets.map((ds) => ds.value).join("|")
            : "",
          all_matches: true
        },
        searchValue,
        fetchJson
      });
    },
    timeoutMs: 1000,
    initSearchValue
  });

  const onInputChange = (value) => {
    setInputValue(value);
    // Will save the user entry if it is not the determination scientific name
    // use case is for association host organism
    if (!isDetermination) {
      setValue?.(value);
      onChange?.(value, formik as any);
    }
  };

  return (
    <div className="card card-body">
      <div className="d-flex align-items-center">
        <div className="flex-grow-1">
          {isDetermination ? (
            <div>
              <div className="input-group">
                <input
                  aria-label={formatMessage("globalNameSearchLabel")}
                  className="form-control global-name-input"
                  onChange={(e) => onInputChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
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
                  className="btn btn-primary global-name-search-button"
                  type="button"
                  disabled={
                    searchIsDisabled ||
                    !selectedDatasets ||
                    selectedDatasets.length === 0
                  }
                >
                  <DinaMessage id="searchButton" />
                </button>
              </div>
              {datasetOptions && (
                <div className="d-flex align-items-center justify-content-end mb-2">
                  {!searchIsDisabled &&
                    selectedDatasets &&
                    selectedDatasets.length === 0 && (
                      <p>
                        <DinaMessage id="globalNameSourcesMustSelectOne" />
                      </p>
                    )}
                  <Select
                    isMulti
                    name="globalNameSources"
                    options={datasetOptions}
                    value={selectedDatasets}
                    onChange={(newValue) => {
                      setSelectedDatasets(Array.from(newValue));
                    }}
                    placeholder={formatMessage("globalNameSources")}
                    className="flex-fill mt-2"
                    components={{
                      Option: CustomDataSourceOption
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <input
                aria-label={formatMessage("colSearchLabel")}
                className="form-control global-name-input"
                onChange={(e) => onInputChange(e.target.value)}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.keyCode === 13) {
                    e.preventDefault();
                    doThrottledSearch(inputValue);
                  }
                }}
                value={inputValue}
              />
              <button
                onClick={doThrottledSearch}
                className="btn btn-primary ms-auto mt-2 global-name-search-button"
                type="button"
                disabled={searchIsDisabled}
              >
                <DinaMessage id="searchButton" />
              </button>
            </div>
          )}
        </div>
      </div>
      {isDetermination && (
        <Field>
          {({ form: { values: formState } }) => {
            const materialSample = formState;
            const verbatimScientificName =
              materialSample.determination?.[index ?? 0]
                ?.verbatimScientificName;
            const scientificName =
              materialSample.determination?.[index ?? 0]?.scientificName;
            const hasScientificName = !!scientificName;
            const hasVerbatimScientificName = !!verbatimScientificName;
            return (
              (hasVerbatimScientificName || hasScientificName) && (
                <div className="d-flex align-items-center mb-3">
                  {hasVerbatimScientificName && (
                    <FormikButton
                      className="btn btn-link"
                      buttonProps={() => ({ style: { marginLeft: "-10px" } })}
                      onClick={() => doThrottledSearch(verbatimScientificName)}
                    >
                      <DinaMessage id="field_verbatimScientificName" />
                    </FormikButton>
                  )}

                  {hasScientificName && (
                    <FormikButton
                      className={`btn btn-link`}
                      buttonProps={() =>
                        !hasVerbatimScientificName
                          ? { style: { marginLeft: "-10px" } }
                          : {}
                      }
                      onClick={() => doThrottledSearch(scientificName)}
                    >
                      <DinaMessage id="field_scientificNameInput" />
                    </FormikButton>
                  )}
                </div>
              )
            );
          }}
        </Field>
      )}
      {searchIsLoading && <LoadingSpinner loading={true} />}
      {!!searchResult && (
        <div className="list-group mt-3">
          {searchResult.names
            ?.filter((result) => result.matchType !== "NoMatch")
            ?.map((name) => {
              return name.results.map((result, idx) => {
                const link = document.createElement("a");
                link.setAttribute("href", result.outlink);

                const paths = result?.classificationPath?.split("|");
                const ranks = result?.classificationRanks?.split("|");

                const familyIdx = ranks?.findIndex((path) => path === "family");
                const familyRank =
                  familyIdx >= 0 ? paths[familyIdx] + ": " : undefined;

                let displayText = result?.matchedName;
                inputValue
                  .split(" ")
                  .filter((val) => !!val?.length)
                  .map(
                    (val) =>
                      (displayText = displayText.replace(val, `<b>${val}</b>`))
                  );
                displayText += ` <span class="small">[${result.dataSourceTitleShort}]</span>`;

                link.innerHTML = familyRank
                  ? familyRank + displayText
                  : displayText;

                // Use DOMPurify to sanitize against XSS when using dangerouslySetInnerHTML:
                const safeHtmlLink: string = DOMPurify.sanitize(
                  link.outerHTML,
                  {
                    ADD_ATTR: ["target", "rel"]
                  }
                );

                const detail: ScientificNameSourceDetails = {};
                detail.labelHtml = link.innerHTML ?? "";
                detail.sourceUrl = link.href.replace("undefined", "list");
                detail.recordedOn = dateSupplier();
                detail.classificationPath = result?.classificationPath;
                detail.classificationRanks = result?.classificationRanks;
                detail.isSynonym = result.isSynonym;
                detail.currentName = result.currentName;

                // Use detail to populate source details fields, result.label to populate the searchbox bound field
                const resultArray = [detail, result?.matchedName];

                return (
                  <div
                    key={result.inputId ?? idx}
                    className="list-group-item list-group-item-action d-flex"
                  >
                    <div className="flex-grow-1 d-flex align-items-center gn-search-result-label">
                      {result.outlink ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: safeHtmlLink.replace(
                              /<a /g,
                              '<a target="_blank" rel="noopener noreferrer" '
                            )
                          }}
                        />
                      ) : (
                        <span>{detail.currentName}</span>
                      )}
                    </div>

                    <FormikButton
                      className="btn btn-primary global-name-select-button"
                      buttonProps={() => ({ style: { width: "8rem" } })}
                      onClick={() => onSelect?.(resultArray)}
                    >
                      <DinaMessage id="select" />
                    </FormikButton>
                  </div>
                );
              });
            })}
        </div>
      )}
      {searchResult?.length === 1 &&
        searchResult[0].matchType === "NoMatch" && (
          <p>
            <DinaMessage id="noResultsFound" />
          </p>
        )}
    </div>
  );
}
export interface GlobalNamesSearchParams {
  url: string;
  params?: Record<string, any>;
  searchValue: string;
  fetchJson?: (url: string) => Promise<any>;
}

export async function globalNamesQuery<T>({
  url,
  params,
  searchValue,
  fetchJson = (urlArg) => window.fetch(urlArg).then((res) => res.json())
}: GlobalNamesSearchParams): Promise<T | null> {
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

export interface GlobalNamesSourcesQueryParams {
  url: string;
  fetchJson?: (url: string) => Promise<any>;
}
export async function globalNamesSourcesQuery<T>({
  url,
  fetchJson = (urlArg) => window.fetch(urlArg).then((res) => res.json())
}: GlobalNamesSourcesQueryParams): Promise<T | null> {
  const urlObject = new URL(url);
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
