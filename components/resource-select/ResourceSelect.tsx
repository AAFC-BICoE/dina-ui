import { FilterParam, GetParams, KitsuResource } from "kitsu";
import { debounce, omitBy } from "lodash";
import React from "react";
import { Async as AsyncSelect } from "react-select";
import { OptionsType } from "react-select/lib/types";
import { isUndefined } from "util";
import {
  ApiClientContext,
  ApiClientContextI
} from "../../components/api-client/ApiClientContext";

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

/** Dropdown select input for selecting a resource from the API. */
export class ResourceSelect<
  TData extends KitsuResource
> extends React.Component<ResourceSelectProps<TData>> {
  public static contextType = ApiClientContext;
  public context!: ApiClientContextI;

  public render() {
    const { value, optionLabel } = this.props;

    // Debounces the loadOptions function to avoid sending excessive API requests.
    const debouncedOptionLoader = debounce((inputValue, callback) => {
      this.loadOptions(inputValue, callback);
    }, 250);

    // Set the component's value externally when used as a controlled input.
    const selectedValue = value
      ? { label: optionLabel(value), value }
      : undefined;

    return (
      <AsyncSelect
        value={selectedValue}
        defaultOptions={true}
        loadOptions={debouncedOptionLoader}
        onChange={this.onChange}
      />
    );
  }

  /** Loads options by getting a list of resources from the back-end API. */
  private async loadOptions(
    inputValue: string,
    callback: (options: OptionsType<any>) => void
  ) {
    const { filter, include, optionLabel, model, sort } = this.props;
    const { apiClient } = this.context;

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
    const options = data.map(resource => ({
      label: optionLabel(resource),
      value: resource
    }));

    callback(options);
  }

  private onChange = option => {
    // When there is no onChange prop, do nothing.
    if (!this.props.onChange) {
      return;
    }

    // Call the provided onChange method with the selected value.
    this.props.onChange(option.value);
  };
}
