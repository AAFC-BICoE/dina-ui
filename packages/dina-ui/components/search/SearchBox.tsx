import { DocWithData } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { deserialise } from "kitsu-core";
import { compact, debounce, get, startCase } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Select, { components, OptionProps, OptionTypeBase } from "react-select";
import useSWR from "swr";
import { useApiClient } from "../../../common-ui/lib";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";

// The parts of the API response used by this component:
export interface AutocompleteSearchResponse {
  hits?: {
    hits?: {
      id?: string;
      index?: string;
      sourceAsMap?: DocWithData;
    }[];
  };
}

// The data passed from each API search result into a Select Option:
export interface SearchResult {
  link?: string;
  name: string;
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
        name: `Person: ${(resource as Person).displayName}`,
        link: `/person/view?id=${id}`
      };
  }

  return {
    name: `${startCase(resource.type)}: ${
      get(resource, "name") ?? resource.id ?? String(resource)
    }`
  };
}

/** Autocomplete search box to link to other pages of the application. */
export function SearchBox() {
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

  const selectOptions =
    data?.map(result => ({
      label: result.name,
      value: result.link
    })) ?? [];

  const customStyle: any = {
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
      onChange={option => option?.value && router.push(option.value)}
      inputValue={search.input}
      isLoading={isValidating}
      value={null}
      styles={customStyle}
      components={{
        Option: LinkOption
      }}
      noOptionsMessage={() => formatMessage("noResultsFound")}
    />
  );
}

/** Changes the select menu Option into a regular link for the Search Box. */
function LinkOption(props: OptionProps<OptionTypeBase, boolean>) {
  const link = props.data.value;

  // Customize react-select's Option component:
  const option = (
    <components.Option
      {...props}
      innerProps={{
        ...props.innerProps,
        // Middle clicking a link shouldn't close the menu:
        ...{ onMouseDown: e => e.preventDefault() },
        // Clicking a link shouldn't select the option:
        onClick: () => undefined
      }}
    />
  );

  // Wrap the option in a Link:
  return link ? (
    <Link href={link}>
      <a>{option}</a>
    </Link>
  ) : (
    option
  );
}
