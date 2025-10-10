import {
  FilterParam,
  KitsuResource,
  KitsuResourceLink,
  PersistedResource
} from "kitsu";
import _ from "lodash";
import { ComponentProps, useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { ActionMeta, StylesConfig } from "react-select";
import { useDebounce } from "use-debounce";
import { SelectOption, useAccount } from "../..";
import { JsonApiQuerySpec, useQuery } from "../api-client/useQuery";
import { useBulkGet } from "./useBulkGet";
import { SortableSelect } from "common-ui";

/** ResourceSelect component props. */
export interface ResourceSelectProps<TData extends KitsuResource> {
  /** Sets the input's value so the value can be controlled externally. */
  value?: ResourceSelectValue<TData>;

  /** Function called when an option is selected. */
  onChange?: (
    value: null | PersistedResource<TData> | PersistedResource<TData>[],
    actionMeta?: ActionMeta<{ resource: PersistedResource<TData> }>
  ) => void;

  /** Callback fired when data has been loaded from the API */
  onDataLoaded?: (data: PersistedResource<TData>[] | undefined) => void;

  /** The model type to select resources from. */
  model: string;

  /** Function to get the option label for each resource. */
  optionLabel: (
    resource: PersistedResource<TData>
  ) => string | null | JSX.Element;

  /** Function that is passed the dropdown's search input value and returns a JSONAPI filter param. */
  filter: (inputValue: string) => FilterParam;

  filterList?: (item: any | undefined) => boolean;

  /**
   * Sort order + attribute.
   * Examples:
   *  - name
   *  - -description
   */
  additionalSort?: string;

  /** Whether this is a multi-select dropdown. */
  isMulti?: boolean;

  /** The JSONAPI "include" parameter. */
  include?: string;

  /** react-select styles prop. */
  styles?: Partial<StylesConfig<SelectOption<any>, boolean>>;

  /** Special dropdown options that can fetch an async value e.g. by creating a resource in a modal. */
  asyncOptions?: AsyncOption<TData>[];

  isDisabled?: boolean;

  /** Omits the "<none>" option. */
  omitNullOption?: boolean;

  invalid?: boolean;

  selectProps?: Partial<ComponentProps<typeof SortableSelect>>;

  /** Page limit. */
  pageSize?: number;

  /** Use a different query hook instead of the REST API. */
  useCustomQuery?: (
    searchQuery: string,
    querySpec: JsonApiQuerySpec
  ) => {
    loading?: boolean;
    response?: { data: PersistedResource<TData>[] };
  };

  /* Remove the default sort by createdOn */
  removeDefaultSort?: boolean;

  placeholder?: string;

  isLoading?: boolean;

  /** If true, disable the dropdown when the selected option is the only one available */
  cannotBeChanged?: boolean;

  showGroupCategary?: boolean;
}

type ResourceSelectValue<TData extends KitsuResource> =
  | PersistedResource<TData>
  | PersistedResource<TData>[]
  | KitsuResourceLink;

/**
 * Special dropdown option that can fetch an async value.
 * e.g. setting a resource after the user created it through a modal.
 */
export interface AsyncOption<TData extends KitsuResource> {
  /** Option label. */
  label: string | JSX.Element;

  /**
   * Function called to fetch the resource when the option is selected.
   * Returning undefined doesn't set the value.
   */
  getResource: () => Promise<PersistedResource<TData> | undefined>;
}

/** Dropdown select input for selecting a resource from the API. */
export function ResourceSelect<TData extends KitsuResource>({
  filter,
  filterList,
  include,
  isMulti = false,
  model,
  onChange: onChangeProp = () => undefined,
  optionLabel,
  styles,
  value,
  asyncOptions,
  isDisabled: isDisabledProp,
  omitNullOption,
  invalid,
  selectProps,
  pageSize,
  useCustomQuery,
  removeDefaultSort,
  placeholder,
  isLoading: loadingProp,
  cannotBeChanged,
  showGroupCategary = false,
  additionalSort,
  onDataLoaded
}: ResourceSelectProps<TData>) {
  const { formatMessage } = useIntl();
  const { isAdmin, groupNames } = useAccount();

  /** The value of the input element. */
  const [inputValue, setInputValue] = useState("");

  /** The debounced input value passed to the fetcher. */
  const [searchValue] = useDebounce(inputValue, 250);

  // Omit blank/null filters:
  const filterParam = _.omitBy(filter(searchValue), (val) =>
    ["", undefined].includes(val as string)
  );

  let isDisabled = isDisabledProp;

  // "6" is chosen here to give enough room for the main options, the <none> option, and the
  const page = { limit: pageSize ?? 6 };
  const sort = additionalSort
    ? additionalSort
    : !removeDefaultSort
    ? "-createdOn"
    : undefined;

  // Omit undefined values from the GET params, which would otherwise cause an invalid request.
  // e.g. /api/region?include=undefined
  const querySpec: JsonApiQuerySpec = {
    path: model,
    ..._.omitBy(
      { filter: filterParam, include, page, sort },
      (val) => _.isUndefined(val) || _.isEqual(val, {})
    )
  };

  const { loading: queryIsLoading, response } =
    useCustomQuery?.(inputValue, querySpec) ?? useQuery<TData[]>(querySpec);

  const isLoading = queryIsLoading || inputValue !== searchValue || loadingProp;

  useEffect(() => {
    // Only call when data is actually loaded (not when loading)
    if (!isLoading && response?.data && onDataLoaded) {
      onDataLoaded(response.data);
    }
  }, [isLoading, response, onDataLoaded]);

  // Build the list of options from the returned resources.
  const resourceOptions =
    response?.data
      .map((resource) => ({
        label: optionLabel(resource),
        resource,
        value: resource.id
      }))
      .sort((optionA, optionB) => {
        if (optionA.label && optionB.label) {
          return optionA.label
            .toString()
            .toLowerCase()
            .localeCompare(optionB.label.toString().toLowerCase());
        }

        // Unable to perform sort.
        return 0;
      }) ?? [];

  const groupedResourceOptions = showGroupCategary
    ? _.chain(resourceOptions)
        .groupBy((item) => (item.resource as any).group)
        .map((items, label) => ({
          label,
          options: items
        }))
        .sort((a, b) => {
          if (a.label === b.label) {
            return 0;
          } else {
            if (groupNames?.includes(a.label) && groupNames.includes(b.label)) {
              return a.label.localeCompare(b.label);
            } else if (
              groupNames?.includes(a.label) &&
              !groupNames.includes(b.label)
            ) {
              return -1;
            } else {
              return 1;
            }
          }
        })
        .value()
    : resourceOptions;
  /** An option the user can select to set the relationship to null. */
  const NULL_OPTION = Object.seal({
    label: `<${formatMessage({ id: "none" })}>`,
    resource: Object.seal({ id: null }),
    value: null
  });

  // Main options group.
  const mainOptions = {
    label: searchValue
      ? formatMessage({ id: "dropdownSearchResults" })
      : formatMessage({ id: "typeToSearchOrChooseFromNewest" }),
    options: [
      ...(!isMulti && !searchValue && !omitNullOption ? [NULL_OPTION] : []),
      ...(!showGroupCategary ? resourceOptions : [])
    ]
  };

  const actionOptions = asyncOptions && {
    label: formatMessage({ id: "actions" }),
    options: asyncOptions
  };

  // Show no options while loading: (react-select will show the "Loading..." text.)
  const options = isLoading
    ? []
    : _.compact([
        mainOptions,
        ...(showGroupCategary ? groupedResourceOptions : []),
        actionOptions
      ]);

  async function onChange(
    newSelectedRaw,
    actionMeta?: ActionMeta<{ resource: PersistedResource<TData> }>
  ) {
    if (!newSelectedRaw) {
      // when delete all the selected options.
      onChangeProp(isMulti ? [] : null, actionMeta);
    } else {
      const newSelected = _.castArray(newSelectedRaw);
      // If an async option is selected:
      const asyncOption: AsyncOption<TData> | undefined = newSelected?.find(
        (option) => option?.getResource
      );

      if (asyncOption && newSelectedRaw) {
        // For callback options, don't set any value:
        const asyncResource = await asyncOption.getResource();
        if (asyncResource) {
          const newResources = newSelected.map((option) =>
            option === asyncOption ? asyncResource : option.resource
          );
          onChangeProp(isMulti ? newResources : newResources[0], actionMeta);
        }
      } else {
        const resources = newSelected?.map((o) => o.resource) || [];
        onChangeProp(isMulti ? resources : resources[0], actionMeta);
      }
    }
  }

  const valueAsArray = _.compact(_.castArray(value));

  // Sometimes only the ID and type are available in the form state:
  const valueIsShallowReference = isShallowReference(valueAsArray);

  const selectedResources =
    useBulkGet<TData>({
      ids: valueAsArray.map((it) => String(it.id)),
      listPath: model,
      disabled: !valueIsShallowReference
    }).data ?? valueAsArray;

  // Convert the field value to react-select option objects:
  const seenKeys = [] as string[];
  const selectedAsArray: any[] = selectedResources.map((resource, index) => {
    if (!resource) {
      return null;
    }
    if (resource.id === null) {
      return NULL_OPTION;
    }

    if (!optionLabel(resource as PersistedResource<TData>)) {
      return null;
    }
    let id: string;

    if (seenKeys.includes(resource.id)) {
      id = resource.id + index;
      return null;
    } else {
      seenKeys.push(resource.id);
      id = resource.id;
    }

    return {
      label: optionLabel(resource as PersistedResource<TData>) ?? resource.id,
      resource,
      value: id
    };
  });
  const selectValue = isMulti ? selectedAsArray : selectedAsArray[0] ?? null;

  // Disable dropdown if the selected option is the only option available
  if (cannotBeChanged && !isMulti) {
    isDisabled =
      !isAdmin &&
      resourceOptions.length === 1 &&
      selectValue?.value === resourceOptions?.[0]?.value;
  }

  const customStyle: any = {
    ...styles,
    multiValueLabel: (base) => ({ ...base, cursor: "move" }),
    placeholder: (base) => ({ ...base, color: "rgb(87,120,94)" }),
    control: (base) => ({
      ...base,
      ...(invalid && {
        borderColor: "rgb(148, 26, 37)",
        "&:hover": { borderColor: "rgb(148, 26, 37)" }
      })
    }),
    menu: (base) => ({ ...base, zIndex: 9001 }),
    // Make the menu's height fit the resource options and the action options:
    menuList: (base) => ({ ...base, maxHeight: "400px" }),
    group: (base, gProps) => ({
      ...base,
      // Make Action options bold:
      ...(gProps.label === actionOptions?.label ? { fontWeight: "bold" } : {})
    }),
    // Grouped options (relationships) should be indented.
    option: (baseStyle, { data }) => {
      if (data?.resource) {
        return {
          ...baseStyle,
          paddingLeft: "25px"
        };
      }

      // Default style for everything else.
      return {
        ...baseStyle
      };
    }
  };

  return (
    <SortableSelect
      // react-select props:
      isMulti={isMulti}
      inputValue={inputValue}
      onChange={onChange}
      isLoading={isLoading}
      options={options}
      placeholder={placeholder ?? formatMessage({ id: "typeHereToSearch" })}
      loadingMessage={() => formatMessage({ id: "loadingText" })}
      styles={customStyle}
      classNamePrefix="react-select"
      value={selectValue}
      // The filtering is already done at the API level:
      filterOption={({ data }) => filterList?.((data as any)?.resource) ?? true}
      isDisabled={isDisabled}
      {...selectProps}
      onInputChange={(newVal, actionMeta) => {
        setInputValue(newVal);
        selectProps?.onInputChange?.(newVal, actionMeta);
      }}
    />
  );
}

export function isShallowReference(resourceArray: any[]) {
  const firstElement = _.castArray(resourceArray)[0];
  return (
    !!firstElement?.id && _.isEqual(_.keys(firstElement).sort(), ["id", "type"])
  );
}
