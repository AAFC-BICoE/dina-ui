import { NominatumApiSearchResult } from "packages/common-ui/lib";
import { useState } from "react";
import { CommonMessage } from "packages/common-ui/lib/intl/common-ui-intl";
import { DinaMessage} from "packages/dina-ui/intl/dina-ui-intl";

interface GeoGraphySearchDialogProps  {
    searchByValue: string;
    closeModal: ()=>void ;
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

  const fetchJson = url => window.fetch(url).then(res => res.json());

  try {
    const results = await fetchJson(url.toString());
    return results as NominatumApiSearchResult[];
  } catch (error) {
    return [];
  }
};


export function GeographySearchDialog({searchByValue, closeModal}: GeoGraphySearchDialogProps){

    const [administrativeBoundaries, setAdministrativeBoundaries] = useState<NominatumApiSearchResult[]>();
    const [inputValue, setInputValue] = useState(searchByValue);
      /** Whether the Geo Api is on hold. Just to make sure we don't send more requests than we are allowed to. */
    const [geoApiRequestsOnHold, setGeoApiRequestsOnHold] = useState(false);

    const suggestButtonIsDisabled = geoApiRequestsOnHold || !inputValue;

    const searchByValueOnAdminBoundaries = async (searchValue :string, setAdministrativeBoundaries)=> {
      // Set a 1-second API request throttle:
      if (suggestButtonIsDisabled) {
        return;
      }
      setGeoApiRequestsOnHold(true);
      setTimeout(() => setGeoApiRequestsOnHold(false), 1000);
      const geoSearchResults = nominatimSearch(String(searchValue));
    
      // Filter results down to administrative boundaries:
      const administrativeBoundaries = (await geoSearchResults).filter(
        result =>
          result.category === "boundary" && result.type === "administrative"
      );
      setAdministrativeBoundaries(administrativeBoundaries);     
      //setInputValue(inputValue);    
    }      

    function selectGeoResult(result: NominatumApiSearchResult) {
      closeModal();
      setInputValue("");
      //onSelectSearchResult?.(result, formikContext);
    }    

    return(
      <div className="modal-content">

        <div className="modal-header">
          <h2>
            <DinaMessage id="searchResults" />
          </h2>
        </div>
        <div className="modal-body">
          <div className="row">
            <div className="col-md-9">
              <input
                className="form-control"
                onChange={e => setInputValue(e.target.value as any)}
                value={inputValue} />
            </div>
            <div className="col-md-1">
              <button onClick={() => searchByValueOnAdminBoundaries(inputValue as any, setAdministrativeBoundaries)}
                className="btn btn-light text-left" >
                <DinaMessage id="searchButton" />
              </button>
            </div>
          </div>
            {administrativeBoundaries?.map((boundary)=>{
            <div className="row">
              <div className="col-md-2">
                <button
                  type="button"
                  key={boundary.osm_id}
                  className="list-group-item btn btn-light text-left"
                  onClick={() => selectGeoResult(boundary)}
                >
                  {boundary.display_name}
                </button>
              </div>
              <div className="col-md-2">
                <button className="list-group-item btn btn-light text-left">
                  <DinaMessage id="viewDetailButtonLabel" />
                </button>
              </div>
            </div>
          })}

          </div>
        <div className="modal-footer">
          <button className="btn btn-dark" onClick={closeModal}>
            <CommonMessage id="cancelButtonText" />
          </button>
        </div>       
      </div>

    )
}