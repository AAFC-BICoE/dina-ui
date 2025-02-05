import { useState } from "react";
import { CommonMessage, NominatumApiSearchResult } from "common-ui";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

interface GeoGraphySearchDialogProps {
  searchByValue: string;
  closeModal: () => void;
  onSelectSearchResult: (result: NominatumApiSearchResult) => void;
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

  const fetchJson = (urlArg) => window.fetch(urlArg).then((res) => res.json());

  try {
    const results = await fetchJson(url.toString());
    return results as NominatumApiSearchResult[];
  } catch {
    return [];
  }
}

export function GeographySearchDialog({
  searchByValue,
  closeModal,
  onSelectSearchResult
}: GeoGraphySearchDialogProps) {
  const [administrativeBoundaries, setAdministrativeBoundaries] =
    useState<NominatumApiSearchResult[]>();
  const [inputValue, setInputValue] = useState(searchByValue);
  /** Whether the Geo Api is on hold. Just to make sure we don't send more requests than we are allowed to. */
  const [geoApiRequestsOnHold, setGeoApiRequestsOnHold] = useState(false);

  const [count, setCount] = useState(-1);

  const suggestButtonIsDisabled = geoApiRequestsOnHold || !inputValue;

  const { formatMessage } = useDinaIntl();

  const pageTitle = formatMessage("searchResults", {
    resultSize: administrativeBoundaries?.length
  });

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
    closeModal();
    setInputValue("");
    onSelectSearchResult?.(result);
  };

  /* Execute automatically once */
  if (count === -1) {
    searchByValueOnAdminBoundaries(inputValue as any);
    setCount(count + 1);
  }

  return (
    <div className="modal-content">
      <style>{`
        .modal-dialog {
          max-width: calc(30vw - 3rem);          
        }
      `}</style>

      <div className="modal-header">
        <h2>{pageTitle}</h2>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-md-9">
            <input
              className="form-control"
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.keyCode === 13) {
                  e.preventDefault();
                  searchByValueOnAdminBoundaries(inputValue);
                }
              }}
              value={inputValue}
            />
          </div>
          <div className="col-md-1">
            <button
              onClick={() => searchByValueOnAdminBoundaries(inputValue as any)}
              className="btn btn-light text-start"
            >
              <DinaMessage id="searchButton" />
            </button>
          </div>
        </div>
        {administrativeBoundaries?.map((boundary) => (
          <div key={boundary.osm_id}>
            <div className="row">
              <div className="col-md-12">{boundary.display_name}</div>
            </div>
            <div className="row">
              <div className="col-md-4">
                <button
                  type="button"
                  className="btn btn-light text-start"
                  onClick={() => selectGeoResult(boundary)}
                >
                  <CommonMessage id="select" />
                </button>
              </div>
              <div className="col-md-4">
                <a
                  href={`https://www.openstreetmap.org/${boundary.osm_type}/${boundary.osm_id}`}
                  className="btn btn-info"
                  target="_blank"
                >
                  <DinaMessage id="viewDetailButtonLabel" />
                </a>
              </div>
            </div>
            <hr className="text-light" style={{ borderWidth: 1 }} />
          </div>
        ))}
      </div>
      <div className="modal-footer">
        <button className="btn btn-dark" onClick={closeModal}>
          <CommonMessage id="cancelButtonText" />
        </button>
      </div>
    </div>
  );
}
