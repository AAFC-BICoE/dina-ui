import { useDebouncedFetch } from "common-ui";
import Select from "react-select";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { catalogueOfLifeSearch } from "./CatalogueOfLifeSearchBox";
import {
  CatalogueOfLifeDataSetSearchResult,
  DataSetResult
} from "./dataset-search-types";

interface ColDataSetDropdownProps {
  value?: DataSetResult;
  onChange: (newValue?: DataSetResult) => void;

  /** Optionally mock out the HTTP fetch for testing. */
  fetchJson?: (url: string) => Promise<any>;
}

export function ColDataSetDropdown({
  value,
  onChange,
  fetchJson
}: ColDataSetDropdownProps) {
  const { formatMessage } = useDinaIntl();

  const { inputValue, isLoading, searchResult, setInputValue } =
    useDebouncedFetch({
      fetcher: searchValue =>
        catalogueOfLifeSearch<CatalogueOfLifeDataSetSearchResult>({
          url: "https://api.catalogueoflife.org/dataset",
          params: {
            q: searchValue,
            limit: "10"
          },
          searchValue,
          fetchJson
        }),
      timeoutMs: 1000
    });

  const selectOptions =
    searchResult?.result?.map(result => ({
      label: result.title ?? "",
      value: result
    })) ?? [];

  return (
    <Select<{ label: string; value?: DataSetResult }>
      // Input value (for searching)
      inputValue={inputValue}
      onInputChange={newVal => setInputValue(newVal)}
      // Selected value state:
      value={value && { label: value.title ?? String(value), value }}
      onChange={selection => onChange(selection?.value)}
      // Other Select component config:
      isLoading={isLoading}
      placeholder={formatMessage("typeHereToSearch")}
      noOptionsMessage={
        inputValue ? undefined : () => formatMessage("typeHereToSearch")
      }
      isClearable={true}
      styles={{ menu: () => ({ zIndex: 5 }) }}
      options={selectOptions}
    />
  );
}
