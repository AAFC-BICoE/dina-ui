import { TextFieldProps } from "common-ui";
import { FormikContextType, useFormikContext } from "formik";
import { InputHTMLAttributes, useState } from "react";
import { CommonMessage } from "../intl/common-ui-intl";
import { useModal } from "../modal/modal";
import { Tooltip } from "../tooltip/Tooltip";
import { FormikButton } from "./FormikButton";

export type GeoSuggestTextFieldProps = TextFieldProps & GeoSuggestProps;

export interface GeoSuggestProps {
  /** Fetches json from a url. */
  fetchJson?: (url: string) => Promise<any>;

  onSelectSearchResult?: (
    result: NominatumApiSearchResult,
    formik: FormikContextType<any>
  ) => void;

  inputProps?: Omit<InputHTMLAttributes<any>, "onChange" | "value">;
}

export interface NominatumApiSearchResult {
  osm_type: string;
  osm_id: number;
  display_name: string;
  category: string;
  type: string;
  address?: { [key: string]: string | undefined };
}

export function GeoSuggestSearchBox({
  fetchJson = (url) => window.fetch(url).then((res) => res.json()),
  onSelectSearchResult,
  inputProps
}: GeoSuggestProps) {
  const { closeModal, openModal } = useModal();
  const formikContext = useFormikContext<any>();

  /** Whether the Geo Api is on hold. Just to make sure we don't send more requests than we are allowed to. */
  const [geoApiRequestsOnHold, setGeoApiRequestsOnHold] = useState(false);
  const [inputValue, setInputValue] = useState("");

  async function nominatimSearch(
    searchValue: string
  ): Promise<NominatumApiSearchResult[]> {
    if (!searchValue?.trim()) {
      return [];
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.search = new URLSearchParams({
      q: searchValue,
      addressdetails: "1",
      format: "jsonv2"
    }).toString();

    try {
      const results = await fetchJson(url.toString());
      return results as NominatumApiSearchResult[];
    } catch {
      return [];
    }
  }

  const suggestButtonIsDisabled = geoApiRequestsOnHold || !inputValue;

  async function openGeoSuggestModal() {
    // Set a 1-second API request throttle:
    if (suggestButtonIsDisabled) {
      return;
    }
    setGeoApiRequestsOnHold(true);
    setTimeout(() => setGeoApiRequestsOnHold(false), 1000);

    const geoSearchResults = await nominatimSearch(String(inputValue));

    // Filter results down to administrative boundaries:
    const administrativeBoundaries = geoSearchResults.filter(
      (result) =>
        result.category === "boundary" && result.type === "administrative"
    );

    function selectGeoResult(result: NominatumApiSearchResult) {
      closeModal();
      setInputValue("");
      onSelectSearchResult?.(result, formikContext);
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
            {administrativeBoundaries.map((boundary) => (
              <button
                type="button"
                key={boundary.osm_id}
                className="list-group-item btn btn-light text-start"
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

  return (
    <div className="mb-3 geo-suggest-search-box">
      <style>{`.autosuggest-highlighted { background-color: #ddd; }`}</style>
      <label className="w-100">
        <div>
          <strong>
            <CommonMessage id="autoFillGeoSuggestLabel" />
          </strong>
        </div>
        <div className="input-group">
          <input
            className="form-control"
            onChange={(e) => setInputValue(e.target.value)}
            // Pressing enter should open the modal, not submit the form:
            onKeyDown={(e) => {
              if (e.keyCode === 13) {
                e.preventDefault();
                openGeoSuggestModal();
              }
            }}
            value={inputValue}
            {...inputProps}
          />
          <FormikButton
            className="btn btn-info geo-suggest-button"
            buttonProps={() => ({ disabled: suggestButtonIsDisabled })}
            onClick={openGeoSuggestModal}
          >
            <CommonMessage id="geoSuggest" />
          </FormikButton>
          <Tooltip id="geoSuggestTooltip" />
        </div>
      </label>
    </div>
  );
}
