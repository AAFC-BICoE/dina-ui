import { DocWithData } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { deserialise } from "kitsu-core";
import { compact, debounce, get } from "lodash";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { InputProps } from "react-autosuggest";
import Select from "react-select";
import useSWR from "swr";
import { useApiClient } from "../../../common-ui/lib";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";

export interface SearchBoxProps {
  inputProps?: InputProps<any>;
}

export interface AutocompleteSearchResponse {
  hits?: {
    hits?: {
      id?: string;
      index?: string;
      sourceAsMap?: DocWithData;
    }[];
  };
}

/**
 * Get the name and link for a resource.
 * This should be updated for any resource that doesn't have a "name" field.
 */
function getLink(resource: KitsuResource): SearchResult {
  const { id } = resource;

  switch (resource.type) {
    case "person":
      return {
        name: (resource as Person).displayName,
        link: `/person/view?id=${id}`
      };
  }

  return {
    name: get(resource, "name") ?? resource.id ?? String(resource)
  };
}

export interface SearchResult {
  link?: string;
  name: string;
}

export function SearchBox({ inputProps }: SearchBoxProps) {
  const { apiClient } = useApiClient();
  const router = useRouter();
  const { formatMessage } = useDinaIntl();

  const [search, setSearch] = useState({
    /** The user's typed input. */
    input: "",
    /** The actual search value, which is updated after a throttle to avoid excessive API requests. */
    value: ""
  });

  /** Updates the actual search value passed to the API. */
  const debouncedSearchUpdate = useCallback(
    debounce(() => setSearch(({ input }) => ({ input, value: input })), 250),
    []
  );

  useEffect(debouncedSearchUpdate, [search.input]);

  async function doSearch(): Promise<SearchResult[] | null> {
    if (!search.value) {
      return null;
    }

    const response = await apiClient.axios.get<AutocompleteSearchResponse>(
      "search-api/search/auto-complete",
      {
        params: {
          prefix: search.value,
          autoCompleteField: "data.attributes.displayName",
          additionalField: "",
          indexName: "dina_document_index"
        }
      }
    );

    const jsonApiDocs = compact(
      response.data.hits?.hits?.map(hit => hit.sourceAsMap)
    );

    // Deserialize the responses to Kitsu format.
    const resources = await Promise.all(
      jsonApiDocs.map<Promise<KitsuResource>>(
        async doc => (await deserialise(doc)).data
      )
    );

    return resources.map(getLink);
  }

  const { data, error, isValidating } = useSWR([search.value], doSearch);

  function goToPage(link: string) {
    router.push(link);
  }

  const selectOptions =
    data?.map(result => ({
      label: result.name,
      value: result.link
    })) ?? [];

  const customStyle: any = {
    multiValueLabel: base => ({ ...base, cursor: "move" }),
    placeholder: base => ({ ...base, color: "rgb(87,120,94)" }),
    control: base => ({ ...base, cursor: "text" }),
    dropdownIndicator: base => ({ ...base, display: "none" }),
    // Hide the menu when there is no data:
    menu: base => ({ ...base, ...(!data && { display: "none" }) }),
    option: base => ({ ...base, cursor: "pointer" })
  };

  return (
    <Select
      placeholder={formatMessage("search")}
      options={selectOptions}
      onInputChange={newVal =>
        setSearch(current => ({ ...current, input: newVal }))
      }
      onChange={option => option?.value && goToPage(option.value)}
      inputValue={search.input}
      isLoading={isValidating}
      value={null}
      styles={{
        ...customStyle
      }}
      noOptionsMessage={() => formatMessage("noResultsFound")}
    />
  );
}
