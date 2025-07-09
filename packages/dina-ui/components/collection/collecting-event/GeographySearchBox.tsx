import {
  FormikButton,
  LoadingSpinner,
  NominatumApiSearchResult,
  OnFormikSubmit,
  Tooltip
} from "common-ui";
import CoordinateParser from "coordinate-parser";
import { FormikContextType } from "formik";
import { ReactNode, useState } from "react";
import useSWR from "swr";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

interface GeographySearchBoxProps {
  inputValue: string;
  onInputChange: (value: string) => void;

  onSelectSearchResult: OnFormikSubmit<NominatumApiSearchResult>;

  /** Extra JSX to render under the search bar. */
  renderUnderSearchBar?: ReactNode;
}

export interface AddressDetail {
  localname?: string;
  osm_id?: string;
  osm_type?: string;
  place_type?: string;
  class?: string;
  type?: string;
  isaddress?: boolean;
  place_id?: string;
}

async function nominatimSearch(
  searchValue: string
): Promise<NominatumApiSearchResult[] | null> {
  if (!searchValue?.trim()) {
    return null;
  }

  // If search string is in {lat, lon} format then do a reverse geo lookup:
  let coords: CoordinateParser | null;
  try {
    coords = new CoordinateParser(searchValue);
  } catch {
    coords = null;
  }

  const url = new URL(
    `https://nominatim.openstreetmap.org/${coords ? "reverse" : "search"}`
  );
  url.search = new URLSearchParams({
    ...(coords
      ? {
          lat: String(coords.getLatitude()),
          lon: String(coords.getLongitude())
        }
      : { q: searchValue }),
    addressdetails: "1",
    format: "jsonv2"
  }).toString();

  const fetchJson = (urlArg) => window.fetch(urlArg).then((res) => res.json());

  try {
    const response = await fetchJson(url.toString());

    if (response.error) {
      throw new Error(String(response.error));
    }

    // Search API returns an array ; Reverse API returns a single place:
    return (coords ? [response] : response) as NominatumApiSearchResult[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function GeographySearchBox({
  onSelectSearchResult,
  inputValue,
  onInputChange,
  renderUnderSearchBar
}: GeographySearchBoxProps) {
  /** The query passed to the nominatum API. This state is only set when the user submits the search input. */
  const [searchValue, setSearchValue] = useState<string>("");

  const { formatMessage } = useDinaIntl();

  /** Whether the Geo Api is on hold. Just to make sure we don't send more requests than we are allowed to. */
  const [geoApiRequestsOnHold, setGeoApiRequestsOnHold] = useState(false);

  const { isValidating: geoSearchIsLoading, data: searchResults } = useSWR(
    [searchValue, "nominatum-search"],
    nominatimSearch,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  const suggestButtonIsDisabled =
    geoApiRequestsOnHold || !inputValue || geoSearchIsLoading;

  function selectGeoResult(
    result: NominatumApiSearchResult,
    formik: FormikContextType<any>
  ) {
    onInputChange("");
    setSearchValue("");
    onSelectSearchResult?.(result, formik);
  }

  function doSearch() {
    // Set a 1-second API request throttle:
    if (suggestButtonIsDisabled) {
      return;
    }
    setGeoApiRequestsOnHold(true);
    setTimeout(() => setGeoApiRequestsOnHold(false), 1000);

    // Set the new search value which will make useSWR do the lookup:
    setSearchValue(inputValue);
  }

  return (
    <div className="m-2">
      <div className="d-flex mb-3 ">
        <label className="pt-2">
          <strong>
            <DinaMessage id="locationLabel" />
          </strong>
          <Tooltip id="geographySearchBoxTooltip" />
        </label>
        <div className="flex-grow-1">
          <input
            aria-label={formatMessage("locationLabel")}
            className="form-control"
            onChange={(e) => onInputChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.keyCode === 13) {
                e.preventDefault();
                doSearch();
              }
            }}
            value={inputValue}
            data-testid="geographySearchBox"
          />
        </div>
      </div>
      <div className="mb-3 d-flex">
        <button
          style={{ width: "10rem" }}
          onClick={doSearch}
          className="btn btn-primary ms-auto geo-search-button"
          type="button"
          disabled={suggestButtonIsDisabled}
        >
          <DinaMessage id="searchButton" />
        </button>
      </div>
      {renderUnderSearchBar}
      <div className="list-group mb-3">
        {geoSearchIsLoading ? (
          <LoadingSpinner loading={true} />
        ) : searchResults?.length === 0 ? (
          <DinaMessage id="noResultsFound" />
        ) : (
          searchResults?.map((place) => (
            <div className="list-group-item" key={place.osm_id}>
              <style>{`
                .searchResult {
                  font-size:13pt; font-family:verdana,sans-serif;
                }     
                .searchResultCategory {
                  font-size:13pt; font-family:verdana,sans-serif; color: grey;
                }                     
            `}</style>
              <div className="row">
                <div className="col-md-8 searchResult">
                  {place.display_name}
                </div>
                <div className="col-md-4 searchResultCategory">
                  {`[category: ${place.category}]`}
                </div>
              </div>
              <div className="row">
                <div className="col-md-4">
                  <FormikButton
                    className="btn btn-primary"
                    onClick={(_, formik) => selectGeoResult(place, formik)}
                  >
                    <DinaMessage id="select" />
                  </FormikButton>
                </div>

                <div className="col-md-4">
                  <a
                    href={`https://www.openstreetmap.org/${place.osm_type}/${place.osm_id}`}
                    className="btn btn-info"
                    target="_blank"
                  >
                    <DinaMessage id="viewDetailButtonLabel" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
