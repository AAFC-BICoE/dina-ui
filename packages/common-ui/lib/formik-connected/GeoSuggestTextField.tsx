import { TextField, TextFieldProps } from "common-ui";
import { InputHTMLAttributes, useState } from "react";
import { CommonMessage } from "../intl/common-ui-intl";
import { KeyboardEventHandlerWrapper } from "../keyboard-event-handler/KeyboardEventHandlerWrappedTextField";
import { useModal } from "../modal/modal";
import { Tooltip } from "../tooltip/Tooltip";
import { FormikButton } from "./FormikButton";

export type GeoSuggestTextFieldProps = TextFieldProps & GeoSuggestProps;

export interface GeoSuggestProps {
  /** Fetches json from a url. */
  fetchJson?: (url: string) => Promise<any>;
}

export interface NominatumApiSearchResult {
  osm_type: string;
  osm_id: number;
  display_name: string;
  category: string;
  type: string;
  address?: {
    city?: string;
    city_district?: string;
    construction?: string;
    continent?: string;
    country?: string;
    country_code?: string;
    house_number?: string;
    neighbourhood?: string;
    postcode?: string;
    public_building?: string;
    state?: string;
    suburb?: string;
  };
}

/**
 * Suggests typeahead values based on a back-end query.
 * The suggestion values are taken from each returned API resource.
 */
export function GeoSuggestTextField({
  fetchJson,
  ...textFieldProps
}: GeoSuggestTextFieldProps) {
  return (
    <TextField
      {...textFieldProps}
      customInput={inputProps => (
        <GeoSuggestTextFieldInternal
          fetchJson={fetchJson}
          {...(inputProps as any)}
        />
      )}
    />
  );
}

type GeoSuggestTextFieldInternalProps = InputHTMLAttributes<any> &
  GeoSuggestProps;

function GeoSuggestTextFieldInternal({
  fetchJson = url => window.fetch(url).then(res => res.json()),
  ...inputProps
}: GeoSuggestTextFieldInternalProps) {
  const { closeModal, openModal } = useModal();
  /** Whether the Geo Api is on hold. Just to make sure we don't send more requests than we are allowed to. */
  const [geoApiRequestsOnHold, setGeoApiRequestsOnHold] = useState(false);

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

    try {
      const results = await fetchJson(url.toString());
      return results as NominatumApiSearchResult[];
    } catch (error) {
      return [];
    }
  }

  async function openGeoSuggestModal() {
    const geoSearchResults = await nominatimSearch(String(inputProps.value));

    // Set a 1-second API request throttle:
    setGeoApiRequestsOnHold(true);
    setTimeout(() => setGeoApiRequestsOnHold(false), 1000);

    // Filter results down to administrative boundaries:
    const administrativeBoundaries = geoSearchResults.filter(
      result =>
        result.category === "boundary" && result.type === "administrative"
    );

    function selectGeoResult(result: NominatumApiSearchResult) {
      // TODO add callback here to change other fields
      // console.log({ selection: result });
      closeModal();
    }

    openModal(
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            <CommonMessage id="selectLocation" />
          </h2>
        </div>
        <div className="modal-body">
          <div className="list-group suggestion-list">
            {administrativeBoundaries.map(boundary => (
              <button
                key={boundary.osm_id}
                type="button"
                className="list-group-item btn btn-light text-left"
                onClick={() => selectGeoResult(boundary)}
              >
                {boundary.display_name}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-dark" onClick={closeModal}>
            <CommonMessage id="cancelButtonText" />
          </button>
        </div>
      </div>
    );
  }

  const suggestButtonDisabled = geoApiRequestsOnHold || !inputProps.value;

  return (
    <div>
      <style>{`.autosuggest-highlighted { background-color: #ddd; }`}</style>
      <KeyboardEventHandlerWrapper onChange={inputProps.onChange}>
        <textarea rows={3} {...inputProps} />
      </KeyboardEventHandlerWrapper>
      <div className="form-group">
        <div className="float-right">
          <FormikButton
            className="btn btn-info geo-suggest-button"
            buttonProps={() => ({ disabled: suggestButtonDisabled })}
            onClick={openGeoSuggestModal}
          >
            <CommonMessage id="geoSuggest" />
          </FormikButton>
          <Tooltip id="geoSuggestTooltip" />
        </div>
      </div>
    </div>
  );
}
