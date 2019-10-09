import { FilterParam, GetParams, KitsuResource } from "kitsu";
import { debounce, isUndefined, omitBy } from "lodash";
import React, { useContext } from "react";
import AsyncSelect from "react-select/async";
import { ApiClientContext } from "..";
import { OptionsType } from "react-select/src/types";

/** ResourceSelect component props. */
export interface ResourceSelectProps<TData> {
  /** Sets the input's value so the value can be controlled externally. */
  value?: TData | TData[];

  /** Function called when an option is selected. */
  onChange?: (value: TData | TData[]) => void;

  /** The model type to select resources from. */
  model: string;

  /** Function to get the option label for each resource. */
  optionLabel: (resource: TData) => string;

  /** Function that is passed the dropdown's search input value and returns a JSONAPI filter param. */
  filter: (inputValue: string) => FilterParam;

  /** Whether this is a multi-select dropdown. */
  isMulti?: boolean;

  /** The JSONAPI "include" parameter. */
  include?: string;

  /** The JSONAPI "sort" parameter. */
  sort?: string;
}

/** An option the user can select to set the relationship to null. */
const NULL_OPTION = { label: "<none>", resource: { id: null }, value: null };

/** Dropdown select input for selecting a resource from the API. */
export function ResourceSelect<TData extends KitsuResource>({
  filter,
  include,
  isMulti = false,
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
      resource,
      value: resource.id
    }));

    // Only show the null option when in single-resource mode and when there is no search input value.
    const options =
      !isMulti && !inputValue
        ? [NULL_OPTION, ...resourceOptions]
        : resourceOptions;

    callback(options);
  }

  function onChangeInternal(selectedOption) {
    if (selectedOption.resource) {
      // Handle single select:
      onChange(selectedOption.resource);
    } else {
      // Handle multi select:
      const resources = selectedOption.map(o => o.resource);
      onChange(resources);
    }
  }

  // Debounces the loadOptions function to avoid sending excessive API requests.
  const debouncedOptionLoader = debounce((inputValue, callback) => {
    loadOptions(inputValue, callback);
  }, 250);

  // Set the component's value externally when used as a controlled input.
  let selectValue;
  if (isMulti) {
    selectValue = ((value || []) as TData[]).map(resource => ({
      label: optionLabel(resource),
      resource,
      value: resource.id
    }));
  } else {
    selectValue = !value
      ? null
      : (value as TData).id === null
      ? NULL_OPTION
      : {
          label: optionLabel(value as TData),
          resource: value,
          value: (value as TData).id
        };
  }

  return (
    <AsyncSelect
      defaultOptions={true}
      isMulti={isMulti}
      loadOptions={debouncedOptionLoader}
      onChange={onChangeInternal}
      placeholder="Type here to search."
      value={selectValue}
    />
  );
}
