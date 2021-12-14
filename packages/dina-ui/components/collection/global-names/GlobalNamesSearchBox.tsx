import {
  FormikButton,
  LoadingSpinner,
  Tooltip,
  useThrottledFetch
} from "common-ui";
import DOMPurify from "dompurify";
import { Field, FormikProps } from "formik";
import moment from "moment";
import { ScientificNameSourceDetails } from "../../../../dina-ui/types/collection-api/resources/Determination";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { GlobalNamesSearchResult } from "./global-names-search-result-type";

export interface GlobalNamesSearchBoxProps {
  /** Optionally mock out the HTTP fetch for testing. */
  fetchJson?: (url: string) => Promise<any>;

  onSelect?: (
    selection: (string | ScientificNameSourceDetails | undefined)[]
  ) => void;

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

  const {
    searchIsLoading,
    searchResult,
    inputValue,
    setInputValue,
    searchIsDisabled,
    doThrottledSearch
  } = useThrottledFetch({
    fetcher: searchValue =>
      globalNamesQuery<GlobalNamesSearchResult[]>({
        url: `https://verifier.globalnames.org/api/v1/verifications/${
          searchValue[0].toUpperCase() + searchValue.substring(1)
        }`,
        params: {
          capitalize: "false"
        },
        searchValue,
        fetchJson
      }),
    timeoutMs: 1000,
    initSearchValue
  });

  const onInputChange = value => {
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
      <div className="d-flex align-items-center mb-3">
        <div className="flex-grow-1">
          {isDetermination ? (
            <div className="input-group">
              <input
                aria-label={formatMessage("colSearchLabel")}
                className="form-control col-search-input"
                onChange={e => onInputChange(e.target.value)}
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
                className="btn btn-primary mx-2 col-search-button"
                type="button"
                disabled={searchIsDisabled}
              >
                <DinaMessage id="searchButton" />
              </button>
            </div>
          ) : (
            <div>
              <input
                aria-label={formatMessage("colSearchLabel")}
                className="form-control col-search-input"
                onChange={e => onInputChange(e.target.value)}
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
                onClick={doThrottledSearch}
                className="btn btn-primary ms-auto mt-2 col-search-button"
                type="button"
                disabled={searchIsDisabled}
              >
                <DinaMessage id="searchOnCOL" />
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
            const scientificNameInput =
              materialSample.determination?.[index ?? 0]?.scientificNameInput;
            const hasScientificNameInput = !!scientificNameInput;
            const hasVerbatimScientificName = !!verbatimScientificName;
            return (
              (hasVerbatimScientificName || hasScientificNameInput) && (
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

                  {hasScientificNameInput && (
                    <FormikButton
                      className={`btn btn-link`}
                      buttonProps={() =>
                        !hasVerbatimScientificName
                          ? { style: { marginLeft: "-10px" } }
                          : {}
                      }
                      onClick={() => doThrottledSearch(scientificNameInput)}
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
        <div className="list-group">
          {searchResult
            .filter(result => result.matchType !== "NoMatch")
            .map((result, idx) => {
              const link = document.createElement("a");
              link.setAttribute("href", result.bestResult?.outlink);
              link.setAttribute("target", "_blank");
              link.setAttribute("rel", "noopener");

              const paths = result.bestResult?.classificationPath.split("|");
              const ranks = result.bestResult?.classificationRanks.split("|");

              const familyIdx = ranks.findIndex(path => path === "family");
              const familyRank =
                familyIdx >= 0 ? paths[familyIdx] + ": " : undefined;

              let displayText = result.bestResult?.currentName;
              inputValue
                .split(" ")
                .map(
                  val =>
                    (displayText = displayText.replace(val, `<b>${val}</b>`))
                );

              if (familyRank)
                link.innerHTML = familyRank.toUpperCase() + displayText;

              // Use DOMPurify to sanitize against XSS when using dangerouslySetInnerHTML:
              const safeHtmlLink: string = DOMPurify.sanitize(link.outerHTML, {
                ADD_ATTR: ["target", "rel"]
              });

              const detail: ScientificNameSourceDetails = {};
              detail.labelHtml = link.innerHTML ?? "";
              detail.sourceUrl = link.href;
              detail.recordedOn = dateSupplier();

              // Use detail to populate source details fields, result.label to populate the searchbox bound field
              const resultArray = [detail, link.innerHTML];

              return (
                <div
                  key={result.inputId ?? idx}
                  className="list-group-item list-group-item-action d-flex"
                >
                  <div className="flex-grow-1 d-flex align-items-center col-search-result-label">
                    <span dangerouslySetInnerHTML={{ __html: safeHtmlLink }} />
                  </div>
                  <FormikButton
                    className="btn btn-primary col-name-select-button"
                    buttonProps={() => ({ style: { width: "8rem" } })}
                    onClick={() => onSelect?.(resultArray)}
                  >
                    <DinaMessage id="select" />
                  </FormikButton>
                </div>
              );
            })}
        </div>
      )}
      {searchResult?.length === 1 && searchResult[0].matchType === "NoMatch" && (
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
  fetchJson = urlArg => window.fetch(urlArg).then(res => res.json())
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
