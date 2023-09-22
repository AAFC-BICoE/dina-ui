import { useDebouncedFetch } from "common-ui";
import Select from "react-select";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { catalogueOfLifeQuery } from "./CatalogueOfLifeSearchBox";
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
      fetcher: (searchValue) =>
        catalogueOfLifeQuery<CatalogueOfLifeDataSetSearchResult>({
          url: "https://api.catalogueoflife.org/dataset",
          params: {
            q: searchValue.trim(),
            limit: "10"
          },
          searchValue,
          fetchJson
        }),
      timeoutMs: 1000
    });

  function toOption(dataset: DataSetResult) {
    return {
      label: `${dataset.title} ${dataset.key}`,
      value: dataset
    };
  }

  const selectOptions = searchResult?.result?.map(toOption) ?? [];

  return (
    <Select<{ label: string; value?: DataSetResult }>
      // Input value (for searching)
      inputValue={inputValue}
      onInputChange={(newVal) => setInputValue(newVal)}
      // Selected value state:
      value={value && toOption(value)}
      onChange={(selection) => onChange(selection?.value)}
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
