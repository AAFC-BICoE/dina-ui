import { KitsuResource, KitsuResponse } from "kitsu";
import { debounce } from "lodash";
import React from "react";
import { Async as AsyncSelect } from "react-select";
import { OptionsType } from "react-select/lib/types";
import {
  ApiClientContext,
  ApiClientContextI
} from "../../components/api-client/ApiClientContext";

interface ResourceSelectProps<TData> {
  name: string;
  path: string;
  optionLabel: (resource: TData) => string;
}

export class ResourceSelect<
  TData extends KitsuResource
> extends React.Component<ResourceSelectProps<TData>> {
  public static contextType = ApiClientContext;
  public context!: ApiClientContextI;

  public render() {
    const { name } = this.props;
    const debouncedLoadOptions = debounce(this.loadOptions, 250);

    return (
      <AsyncSelect
        cacheOptions={true}
        defaultOptions={true}
        loadOptions={debouncedLoadOptions}
        name={name}
      />
    );
  }

  private loadOptions = (
    inputValue: string,
    callback: ((options: OptionsType<any>) => void)
  ) => {
    const { optionLabel, path } = this.props;
    const { apiClient } = this.context;

    apiClient.get(path, {}).then((response: KitsuResponse<TData[]>) => {
      const { data } = response;

      const options = data.map(resource => ({
        label: optionLabel(resource),
        value: { type: path, id: resource.id }
      }));

      callback(options);
    });
  };
}
