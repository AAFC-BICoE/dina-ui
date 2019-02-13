import { KitsuResource, KitsuResponse } from "kitsu";
import { debounce } from "lodash";
import React from "react";
import { Async as AsyncSelect } from "react-select";
import { OptionsType } from "react-select/lib/types";
import {
  ApiClientContext,
  ApiClientContextI
} from "../../components/api-client/ApiClientContext";
import { JsonApiRelationship } from "../api-client/jsonapi-types";

/** ResourceSelect component props. */
interface ResourceSelectProps<TData> {
  /** Function called when an option is selected. */
  onChange?: (value: JsonApiRelationship) => void;

  /** The model type to select resources from. */
  model: string;

  /** Function to get the option label for each resource. */
  optionLabel: (resource: TData) => string;
}

/** Dropdown select input for selecting a resource from the API. */
export class ResourceSelect<
  TData extends KitsuResource
> extends React.Component<ResourceSelectProps<TData>> {
  public static contextType = ApiClientContext;
  public context!: ApiClientContextI;

  public render() {
    // Debounces the loadOptions function to avoid sending excessive API requests.
    const debouncedOptionLoader = debounce(this.loadOptions, 250);

    return (
      <AsyncSelect
        cacheOptions={true}
        defaultOptions={true}
        loadOptions={debouncedOptionLoader}
        onChange={this.onChange}
      />
    );
  }

  /** Loads options by getting a list of resources from the back-end API. */
  private loadOptions = (
    inputValue: string,
    callback: ((options: OptionsType<any>) => void)
  ) => {
    const { optionLabel, model } = this.props;
    const { apiClient } = this.context;

    // Send the API request.
    apiClient.get(model, {}).then((response: KitsuResponse<TData[]>) => {
      const { data } = response;

      // Build the list of options from the returned resources.
      const options = data.map(resource => ({
        label: optionLabel(resource),
        value: { data: { type: model, id: resource.id } } as JsonApiRelationship
      }));

      callback(options);
    });
  };

  private onChange = option => {
    this.props.onChange(option.value);
  };
}
