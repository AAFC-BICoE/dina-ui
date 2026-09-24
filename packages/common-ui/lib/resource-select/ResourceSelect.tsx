import {
  FilterParam,
  KitsuResource,
  KitsuResourceLink,
  PersistedResource
} from "kitsu";
import _ from "lodash";
import { ComponentProps, useEffect, useRef, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { useIntl } from "react-intl";
import { ActionMeta, StylesConfig } from "react-select";
import { useDebounce } from "use-debounce";
import {
  getInitialScopeValues,
  getNestedValue,
  passesScopeOptionFilters,
  SCOPE_HEADER_HEIGHT_VAR,
  ScopedMenuList,
  ScopeOption,
  ScopeValues,
  SelectOption,
  SimpleSearchFilterBuilder,
  useAccount
} from "../..";
import { JsonApiQuerySpec, useQuery } from "../api-client/useQuery";
import { HighlightedText } from "./HighlightedText";
import { useBulkGet } from "./useBulkGet";
import { SortableSelect } from "common-ui";

/** ResourceSelect component props. */
export interface ResourceSelectBaseProps<TData extends KitsuResource> {
  /** Sets the input's value so the value can be controlled externally. */
  value?: ResourceSelectValue<TData>;

  /** Function called when an option is selected. */
  onChange?: (
    value: null | PersistedResource<TData> | PersistedResource<TData>[],
    actionMeta?: ActionMeta<{ resource: PersistedResource<TData> }>
  ) => void;

  /** Callback fired when data has been loaded from the API */
  onDataLoaded?: (data: PersistedResource<TData>[] | undefined) => void;

  /** Function to get the option label for each resource. */
  optionLabel: (
    resource: PersistedResource<TData>
  ) => string | null | React.JSX.Element;

  /**
   * Sort order + attribute.
   * Examples:
   *  - name
   *  - -description
   */
  additionalSort?: string;

  /** Whether this is a multi-select dropdown. */
  isMulti?: boolean;

  /** react-select styles prop. */
  styles?: Partial<StylesConfig<SelectOption<any>, boolean>>;

  /** Special dropdown options that can fetch an async value e.g. by creating a resource in a modal. */
  asyncOptions?: AsyncOption<TData>[];

  isDisabled?: boolean;

  /** Omits the "<none>" option. */
  omitNullOption?: boolean;

  invalid?: boolean;

  placeholder?: string;

  isLoading?: boolean;

  /** If true, disable the dropdown when the selected option is the only one available */
  cannotBeChanged?: boolean;

  /** The model type to select resources from. */
  model: string;

  selectProps?: Partial<ComponentProps<typeof SortableSelect>>;

  filterList?: (item: any | undefined) => boolean;

  /**
   * List of scope definitions (e.g. toggles) sticky-rendered inside the select dropdown menu.
   */
  scopes?: ScopeOption[];

  /**
   * Programmically set what the default scope values should be.
   */
  defaultScopes?: ScopeValues;

  /**
   * Display the already selected options in the menu, grayed out and disabled, instead of hiding
   * them. Pair with HIDE_SELECTED_SCOPE to let the user hide them.
   */
  showSelectedOptions?: boolean;

  /**
   * Define an attribute on the entity to group options by in the dropdown list.
   *
   * e.g. "group"
   */
  groupBy?: string;
}

export interface ResourceSelectProps<TData extends KitsuResource>
  extends ResourceSelectBaseProps<TData> {
  /** The JSONAPI "include" parameter. */
  include?: string;

  /** Function that is passed the dropdown's search input value and returns a JSONAPI filter param. */
  filter: (inputValue: string) => FilterParam;

  /** Page limit. */
  pageSize?: number;

  /* Remove the default sort by createdOn */
  removeDefaultSort?: boolean;
}

export interface ResourceSelectCustomQueryProps<TData extends KitsuResource>
  extends ResourceSelectProps<TData> {
  useCustomQuery: (options: any) => {
    loading?: boolean;
    response?: { data: PersistedResource<TData>[] };
  };
  customQueryOptions: any;
}

export interface ResourceSelectInnerProps<TData extends KitsuResource>
  extends ResourceSelectBaseProps<TData> {
  queryIsLoading?: boolean;
  response?: { data: PersistedResource<TData>[] } | undefined;
  inputValue: string;
  setInputValue: (value: string) => void;
  searchValue?: string;
  activeScopes?: ScopeValues;
  onScopeChange?: (scopeId: string, scopeValue: string | boolean) => void;
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
  label: string | React.JSX.Element;

  /**
   * Function called to fetch the resource when the option is selected.
   * Returning undefined doesn't set the value.
   */
  getResource: () => Promise<PersistedResource<TData> | undefined>;
}

/**
 * A debounced search-as-you-type dropdown component that fetches resources
 * from a JSONAPI-compliant backend.
 * Use ResourceSelectCustomQuery if you need to use a custom data-fetching hook.
 */
export function ResourceSelect<TData extends KitsuResource>(
  props: ResourceSelectProps<TData>
) {
  const {
    filter,
    model,
    additionalSort,
    pageSize,
    removeDefaultSort,
    include,
    scopes,
    defaultScopes
  } = props;

  /** The value of the input element. */
  const [inputValue, setInputValue] = useState("");

  /** The debounced input value passed to the fetcher. */
  const [searchValue] = useDebounce(inputValue, 250);

  // Initialize active states for all scopes
  const [activeScopes, setActiveScopes] = useState<ScopeValues>(() =>
    getInitialScopeValues(scopes, defaultScopes)
  );

  // Omit blank/null filters:
  const filterParam = _.omitBy(
    SimpleSearchFilterBuilder.create<any>()
      .add(filter(searchValue))
      .applyScopes(scopes, activeScopes)
      .build(),
    (val) => ["", undefined].includes(val as string)
  );

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

  const { loading: queryIsLoading, response } = useQuery<TData[]>(querySpec);

  return ResourceSelectInner<TData>({
    ...props,
    inputValue,
    setInputValue,
    queryIsLoading,
    response,
    searchValue,
    activeScopes,
    onScopeChange: (scopeId, scopeValue) => {
      setActiveScopes((prev) => ({ ...prev, [scopeId]: scopeValue }));
    }
  });
}

/**
 * A variation of ResourceSelect that allows for a custom data-fetching hook.
 * Useful when the resource list depends on complex external states or
 * non-standard API endpoints.
 */
export function ResourceSelectCustomQuery<TData extends KitsuResource>(
  props: ResourceSelectCustomQueryProps<TData>
) {
  const {
    customQueryOptions,
    useCustomQuery,
    additionalSort,
    pageSize,
    removeDefaultSort,
    include,
    filter,
    model,
    scopes,
    defaultScopes
  } = props;

  /** The value of the input element. */
  const [inputValue, setInputValue] = useState("");

  /** The debounced input value passed to the fetcher. */
  const [searchValue] = useDebounce(inputValue, 250);

  // Initialize active states for all scopes
  const [activeScopes, setActiveScopes] = useState<ScopeValues>(() =>
    getInitialScopeValues(scopes, defaultScopes)
  );

  // Omit blank/null filters:
  const filterParam = _.omitBy(filter(searchValue), (val) =>
    ["", undefined].includes(val as string)
  );

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

  const resolvedOptions =
    typeof customQueryOptions === "function"
      ? customQueryOptions(searchValue, querySpec)
      : customQueryOptions;

  const { loading: queryIsLoading, response } = useCustomQuery(resolvedOptions);

  return ResourceSelectInner<TData>({
    ...props,
    inputValue,
    setInputValue,
    queryIsLoading,
    response,
    searchValue,
    activeScopes,
    onScopeChange: (scopeId, scopeValue) => {
      setActiveScopes((prev) => ({ ...prev, [scopeId]: scopeValue }));
    }
  });
}

/**
 * Inner component for ResourceSelect.
 * Takes query and input states as props from wrapper components to allow for shared logic between the standard and custom query versions of ResourceSelect.
 * @template TData The KitsuResource type being selected.
 * @param props Combined props from the parent selectors plus internal state
 * like `inputValue` and `response`.
 * * @returns A SortableSelect component configured with resource-specific styles and logic.
 */
export function ResourceSelectInner<TData extends KitsuResource>({
  isDisabled,
  isMulti = false,
  model,
  onChange: onChangeProp = () => undefined,
  optionLabel,
  styles,
  value,
  asyncOptions,
  omitNullOption,
  invalid,
  selectProps,
  placeholder,
  isLoading: loadingProp,
  cannotBeChanged,
  groupBy,
  onDataLoaded,
  queryIsLoading,
  response,
  inputValue,
  setInputValue,
  searchValue,
  filterList,
  scopes,
  activeScopes,
  onScopeChange,
  showSelectedOptions
}: ResourceSelectInnerProps<TData>) {
  const { formatMessage } = useIntl();
  const { isAdmin, groupNames } = useAccount();

  const isLoading = queryIsLoading || inputValue !== searchValue || loadingProp;

  // Keep showing the last loaded options while re-fetching (e.g. after a scope change or selection)
  // so the menu doesn't collapse to a loading message and re-open.
  const lastResponse = useRef(response);
  if (response) {
    lastResponse.current = response;
  }
  const displayedResponse = response ?? lastResponse.current;

  useEffect(() => {
    // Only call when data is actually loaded (not when loading)
    if (!isLoading && response?.data && onDataLoaded) {
      onDataLoaded(response.data);
    }
  }, [isLoading, response, onDataLoaded]);

  // Build the list of options from the returned resources.
  const resourceOptions =
    displayedResponse?.data
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

  const groupedResourceOptions = groupBy
    ? _.chain(resourceOptions)
        .groupBy((item) =>
          groupBy
            ? String(getNestedValue(item.resource, groupBy) ?? "") || "Other"
            : (item.resource as any).group
        )
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
    label: <>{formatMessage({ id: "noneOption" })}</>,
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
      ...(!groupBy ? resourceOptions : [])
    ]
  };

  const actionOptions = asyncOptions && {
    label: formatMessage({ id: "actions" }),
    options: asyncOptions
  };

  // Show no options during the initial load: (react-select will show the "Loading..." text.)
  const options =
    isLoading && !displayedResponse
      ? []
      : _.compact([
          mainOptions,
          ...(groupBy ? groupedResourceOptions : []),
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

  const selectedIds = valueAsArray.map((it) => String(it.id));
  const isResourceSelected = (resource?: { id?: string | null }) =>
    !!resource?.id && selectedIds.includes(String(resource.id));

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
    // No top padding, so the sticky scope bar and group headings sit flush with the top.
    menuList: (base) => ({ ...base, paddingTop: 0 }),
    // Keep group headings visible while scrolling, just below the scope header:
    groupHeading: (base, hProps) => ({
      ...(styles?.groupHeading?.(base, hProps) ?? base),
      position: "sticky",
      top: `var(${SCOPE_HEADER_HEIGHT_VAR}, 0px)`,
      zIndex: 1,
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      marginBottom: 0,
      paddingTop: "4px",
      paddingBottom: "4px"
    }),
    group: (base, gProps) => ({
      ...base,
      // Make Action options bold:
      ...(gProps.label === actionOptions?.label ? { fontWeight: "bold" } : {})
    }),
    // Grouped options (relationships) should be indented.
    option: (baseStyle, { data, isDisabled }) => {
      if (data?.resource) {
        return {
          ...baseStyle,
          paddingLeft: "25px",
          // Gray out the already selected options (see showSelectedOptions):
          ...(showSelectedOptions &&
            isDisabled && {
              backgroundColor: "transparent",
              color: "#9ca3af",
              cursor: "not-allowed"
            })
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
      // Search filtering is done at the API level, only the list and scope filters are applied here:
      filterOption={({ data }) => {
        const resource = (data as any)?.resource;
        return (
          (filterList?.(resource) ?? true) &&
          passesScopeOptionFilters(scopes, activeScopes, resource, {
            isSelected: isResourceSelected(resource)
          })
        );
      }}
      {...(showSelectedOptions && {
        hideSelectedOptions: false,
        isOptionDisabled: (option: any) => isResourceSelected(option.resource)
      })}
      isDisabled={isDisabled}
      // Make the menu's height fit the resource options and the action options. Set as a prop
      // (not a style) so react-select can still shrink or flip the menu to fit the viewport.
      maxMenuHeight={400}
      // Highlight the search text within the menu options:
      formatOptionLabel={(option: any, { context }) => {
        if (context !== "menu") {
          return option.label;
        }
        const label =
          typeof option.label === "string" ? (
            <HighlightedText text={option.label} search={inputValue} />
          ) : (
            option.label
          );

        // Tag the already selected options (see showSelectedOptions):
        if (showSelectedOptions && isResourceSelected(option.resource)) {
          return (
            <div className="d-flex align-items-center justify-content-between gap-2">
              <span>{label}</span>
              <span
                className="resource-select-added-tag d-flex align-items-center gap-1 text-nowrap"
                style={{ color: "#16a34a", fontSize: "12px" }}
              >
                <FaCheck />
                {formatMessage({ id: "selectedOptionAdded" })}
              </span>
            </div>
          );
        }
        return label;
      }}
      {...selectProps}
      components={{
        MenuList: ScopedMenuList,
        ...(selectProps?.components || {})
      }}
      onInputChange={(newVal) => setInputValue(newVal)}
      {...({ scopes, activeScopes, onScopeChange } as any)}
    />
  );
}

export function isShallowReference(resourceArray: any[]) {
  const firstElement = _.castArray(resourceArray)[0];
  return (
    !!firstElement?.id && _.isEqual(_.keys(firstElement).sort(), ["id", "type"])
  );
}
