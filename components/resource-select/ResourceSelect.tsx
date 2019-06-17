import { FilterParam, GetParams, KitsuResource } from "kitsu";
import { debounce, omitBy } from "lodash";
import React, { useContext } from "react";
import { Async as AsyncSelect } from "react-select";
import { OptionsType } from "react-select/lib/types";
import { isUndefined } from "util";
import { ApiClientContext } from "../../components/api-client/ApiClientContext";

/** ResourceSelect component props. */
export interface ResourceSelectProps<TData> {
  /** Sets the input's value so the value can be controlled externally. */
  value?: TData;

  /** Function called when an option is selected. */
  onChange?: (value: TData) => void;

  /** The model type to select resources from. */
  model: string;

  /** Function to get the option label for each resource. */
  optionLabel: (resource: TData) => string;

  /** Function that is passed the dropdown's search input value and returns a JSONAPI filter param. */
  filter: (inputValue: string) => FilterParam;

  /** The JSONAPI "include" parameter. */
  include?: string;

  /** The JSONAPI "sort" parameter. */
  sort?: string;
}

/** An option the user can select to set the relationship to null. */
const NULL_OPTION = { label: "<none>", value: { id: null } };

/** Dropdown select input for selecting a resource from the API. */
export function ResourceSelect<TData extends KitsuResource>({
  filter,
  include,
  model,
  onChange = () => undefined,
  optionLabel,
  sort,
  value
}: ResourceSelectProps<TData>) {
  const { apiClient } = useContext(ApiClientContext);

  async function loadOptions(
    inputValue: string,
    callback: (options: OptionsType<any>) => void
  ) {
    const filterParam = inputValue ? filter(inputValue) : undefined;

    // Omit undefined values from the GET params, which would otherwise cause an invalid request.
    // e.g. /api/region?include=undefined
    const getParams = omitBy<GetParams>(
      { filter: filterParam, include, sort },
      isUndefined
    );

    // Send the API request.
    const { data } = await apiClient.get(model, getParams);

    // Build the list of options from the returned resources.
    const resourceOptions = data.map(resource => ({
      label: optionLabel(resource),
      value: resource
    }));

    // Only show the null option when there is no search input value.
    const options = inputValue
      ? resourceOptions
      : [NULL_OPTION, ...resourceOptions];

    callback(options);
  }

  // Debounces the loadOptions function to avoid sending excessive API requests.
  const debouncedOptionLoader = debounce((inputValue, callback) => {
    loadOptions(inputValue, callback);
  }, 250);

  // Set the component's value externally when used as a controlled input.
  const selectedValue = !value
    ? undefined
    : value.id === null
    ? NULL_OPTION
    : { label: optionLabel(value), value };

  return (
    <AsyncSelect
      defaultOptions={true}
      loadOptions={debouncedOptionLoader}
      /* tslint:disable-next-line */
      onChange={({ value }) => onChange(value)}
      placeholder="Type here to search."
      value={selectedValue as any}
    />
  );
}
