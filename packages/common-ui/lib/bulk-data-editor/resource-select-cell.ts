import { HotColumnProps } from "@handsontable/react";
import { GridSettings } from "handsontable";
import {
  FilterParam,
  GetParams,
  KitsuResource,
  PersistedResource
} from "kitsu";
import { debounce } from "lodash";
import { useContext } from "react";
import { ApiClientContext, encodeResourceCell } from "..";
import { ENCODED_RESOURCE_MATCHER } from "./encode-resource-cell";

interface ResourceSelectCellProps<T extends KitsuResource> {
  model: string;
  filter: (inputValue: string) => FilterParam;
  label: (resource: PersistedResource<T>) => string;
  type?: string;
}

export function useResourceSelectCells() {
  const { apiClient } = useContext(ApiClientContext);

  return function resourceSelectCell<T extends KitsuResource>(
    { filter, label, model, type = model }: ResourceSelectCellProps<T>,
    gridSettings?: GridSettings
  ): HotColumnProps {
    async function loadOptions(query: string, process) {
      const isEncodedResource = ENCODED_RESOURCE_MATCHER.test(query);

      const requestParams: GetParams = isEncodedResource
        ? {}
        : { filter: filter(query) };

      // Send the API request.
      const { data } = await apiClient.get<T[]>(model, requestParams);

      const encodedResources = data.map<string>(resource =>
        encodeResourceCell(resource, { label: label(resource), type })
      );

      process(encodedResources);
    }

    const debouncedOptionLoader = debounce(loadOptions, 250);

    return {
      source: debouncedOptionLoader as any,
      type: "dropdown",
      validator: (value, callback) =>
        callback(value === "" || ENCODED_RESOURCE_MATCHER.test(value)),
      ...gridSettings
    };
  };
}
