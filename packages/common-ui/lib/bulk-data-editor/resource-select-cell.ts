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

      // Hide the {type}/{UUID} identifier from the dropdown options:
      makeDropdownOptionsUserFriendly(document);
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

/** Renders the auto-complete dropdowns without the UUIDs to make them more readable. */
export function getUserFriendlyAutoCompleteRenderer(originalRenderer) {
  return function readableAutoCompleteRenderer(_, TD: HTMLElement, ...args) {
    // This custom renderer overrides the original autocomplete renderer:
    originalRenderer(_, TD, ...args);

    // Remove the {type}/{UUID} identifier from the table cell:
    TD.innerHTML = withoutIdentifier(TD.innerHTML);

    return TD;
  };
}

export function makeDropdownOptionsUserFriendly(element: ParentNode) {
  const listboxes = element.querySelectorAll("table.htCore .listbox");

  listboxes.forEach(listbox => {
    listbox.innerHTML = withoutIdentifier(listbox.innerHTML);
  });
}

/** Returns the table cell text without the {type}/{UUID} identifier. */
function withoutIdentifier(tdHtml: string): string {
  if (ENCODED_RESOURCE_MATCHER.test(tdHtml)) {
    let newHtml = tdHtml.replace(ENCODED_RESOURCE_MATCHER, "");
    newHtml = newHtml.substring(0, newHtml.length - 2);
    return newHtml;
  }
  return tdHtml;
}
