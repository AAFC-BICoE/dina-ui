import { NominatumApiSearchResult } from "../../../common-ui/lib";
import { useState, Dispatch, SetStateAction } from "react";
import { CommonMessage } from "../../../common-ui/lib/intl/common-ui-intl";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

interface GeographySearchBoxProps {
  selectSearchResult: (result: NominatumApiSearchResult) => void;
  administrativeBoundaries: NominatumApiSearchResult[];
  setAdministrativeBoundaries: Dispatch<
    SetStateAction<NominatumApiSearchResult[] | undefined>
  >;
}

async function nominatimSearch(
  searchValue: string
): Promise<NominatumApiSearchResult[]> {
  if (!searchValue?.trim()) {
    return [];
  }

  const url = new URL("https://nominatim.openstreetmap.org/search.php");
  url.search = new URLSearchParams({
    q: searchValue,
    addressdetails: "1",
    format: "jsonv2"
  }).toString();

  const fetchJson = urlArg => window.fetch(urlArg).then(res => res.json());

  try {
    const results = await fetchJson(url.toString());
    return results as NominatumApiSearchResult[];
  } catch (error) {
    return [];
  }
}

export function GeographySearchBox({
  selectSearchResult,
  administrativeBoundaries,
  setAdministrativeBoundaries
}: GeographySearchBoxProps) {
  const [inputValue, setInputValue] = useState<string>();
  /** Whether the Geo Api is on hold. Just to make sure we don't send more requests than we are allowed to. */
  const [geoApiRequestsOnHold, setGeoApiRequestsOnHold] = useState(false);
  const suggestButtonIsDisabled = geoApiRequestsOnHold || !inputValue;

  const searchByValueOnAdminBoundaries = async (searchValue: string) => {
    // Set a 1-second API request throttle:
    if (suggestButtonIsDisabled) {
      return;
    }
    setGeoApiRequestsOnHold(true);
    setTimeout(() => setGeoApiRequestsOnHold(false), 1000);
    const geoSearchResults = nominatimSearch(String(searchValue));
    const newAdministrativeBoundaries = await geoSearchResults;
    setAdministrativeBoundaries(newAdministrativeBoundaries);
  };

  const selectGeoResult = (result: NominatumApiSearchResult) => {
    setInputValue("");
    selectSearchResult?.(result);
  };

  return (
    <div>
      <div className="row">
        <div className="col-md-1">
          <label>
            <strong>
              <DinaMessage id="LocationLabel" />
            </strong>
          </label>
        </div>
        <div className="col-md-8">
          <input
            className="form-control"
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.keyCode === 13) {
                e.preventDefault();
                searchByValueOnAdminBoundaries(inputValue as any);
              }
            }}
            value={inputValue}
          />
        </div>
        <div className="col-md-1">
          <button
            onClick={() => searchByValueOnAdminBoundaries(inputValue as any)}
            className="btn btn-primary"
            type="button"
          >
            <DinaMessage id="searchButton" />
          </button>
        </div>
      </div>
      <div>
        <br />
        {administrativeBoundaries?.map((boundary, index) => (
          <div key={boundary.osm_id}>
            <div className="row">
              <div className="col-md-12">{boundary.display_name}</div>
            </div>
            <div className="row">
              <div className="col-md-4">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => selectGeoResult(boundary)}
                >
                  <CommonMessage id="select" />
                </button>
              </div>

              <div className="col-md-4">
                <a
                  href={`https://www.openstreetmap.org/${boundary.osm_type}/${boundary.osm_id}`}
                  target="_blank"
                  className="btn btn-info"
                >
                  <DinaMessage id="viewDetailButtonLabel" />
                </a>
              </div>
            </div>
            <br />
            {index < administrativeBoundaries?.length - 1 && (
              <hr className="text-light" style={{ borderWidth: 3 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
