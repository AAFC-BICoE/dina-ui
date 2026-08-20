import { KitsuResource, FilterParam } from "kitsu";
import React, { useState, useMemo, useEffect } from "react";
import Select, {
  components,
  MenuListProps,
  ActionMeta,
  SingleValue,
  MultiValue
} from "react-select";
import { useDebounce } from "use-debounce";
import { JsonApiQuerySpec, useQuery } from "../api-client/useQuery";
import { SimpleSearchFilterBuilder } from "../util/simpleSearchFilterBuilder";
import { Props as SelectProps } from "react-select";

/**
 * Definition for a Toggle scope option.
 *
 * Only one option from the toggle can be selected. Can have more than options choices here.
 */
export interface ToggleScopeOption<TData extends Record<string, any>> {
  /**
   * Unique identifier for this scope.
   */
  id: string;

  /**
   * Scope type.
   */
  type: "toggle";

  /**
   * Optional label displayed above the toggle button group.
   */
  label?: string | React.JSX.Element;

  /**
   * Toggle options to be displayed to the user.
   */
  options: {
    /**
     * Unique identifier for the option.
     */
    id: string;

    /**
     * String or component to display inside of the toggle.
     */
    label: string | React.JSX.Element;

    /**
     * If the option is selected, you can use the filter builder to add what filter should be set.
     * @param builder SimpleSearchFilterBuilder, no need to .build() at the end.
     */
    applyFilter: (builder: SimpleSearchFilterBuilder<TData>) => void;
  }[];
}

/**
 * Discriminated union for extendable scope types.
 *
 * Future types (Like dropdownScope for example) can be added here to allow for different types.
 */
export type ScopeOption<TData extends Record<string, any>> =
  ToggleScopeOption<TData>;

/**
 * Standard internal option structure for react-select.
 */
export interface ResourceOption<TData extends KitsuResource> {
  label: string | React.JSX.Element;
  value: string;
  resource: TData;
}

export interface ScopedResourceSelectProps<TData extends KitsuResource> {
  /**
   * The API endpoint to retrieve the resources against.
   *
   * e.g. "collection-api/controlled-vocabulary-item"
   */
  apiEndpoint: string;

  /**
   * List of scope definitions (e.g. toggles) sticky-rendered inside the select dropdown menu.
   */
  scopes: ScopeOption<TData>[];

  /**
   * When the user searches a value inside of the dropdown menu, what attribute in the API should it
   * be searching against.
   *
   * e.g. "name", which will add a search like ?filter[name][eq]= to the api endpoint defined.
   */
  searchField?: string;

  /**
   * Define how the search options should appear in the list.
   *
   * @param resource The entity
   */
  optionLabel: (resource: TData) => string | React.JSX.Element;

  /**
   * Currently selected entity.
   */
  value?: TData | TData[] | null;

  /**
   * Callback triggered when an option is selected inside of the dropdown menu.
   *
   * @param value Entity selected.
   */
  onChange?: (
    value: TData | TData[] | null,
    actionMeta?: ActionMeta<ResourceOption<TData>>
  ) => void;

  /**
   * Callback triggered when option data finishes loading from the API query.
   *
   * @param data List of resources retrieved from the API response payload.
   */
  onOptionListLoaded?: (data: TData[]) => void;

  /**
   * Programmically set what the default scope values should be.
   */
  defaultScopes?: Record<string, string>;

  /**
   * Can multiple values be selected by the dropdown menu.
   */
  isMulti?: boolean;

  /**
   * Gray out the dropdown and allow for no values to be selected. Any values currently set cannot be
   * changed.
   */
  isDisabled?: boolean;

  /**
   * When no value is selected, what text should appear in the dropdown.
   *
   * e.g. "Select a managed attribute..."
   */
  placeholder?: string;

  /**
   * Maximum number of records that can appear in a search.
   */
  pageSize?: number;

  /**
   * If any sorting should be applied.
   */
  sort?: string;

  /**
   * Related JSON:API resources to include in the API response payload. Then it can be used for
   * filtering as well or displaying more information to the user.
   */
  include?: string;

  /**
   * Besides the filtering being applied by the scopes and the text searching, you can supply
   * additional search params here.
   *
   * Recommended to use the SimpleSearchFilterBuilder.
   */
  additionalFilter?: FilterParam;

  /**
   * react-select props to be passed down.
   */
  selectProps?: SelectProps;
}

/**
 * Custom MenuList rendering sticky scope filter controls above options.
 */
const ScopedMenuList = (props: MenuListProps<any, boolean>) => {
  const { scopes, activeScopes, onScopeChange } = props.selectProps as any;

  return (
    <components.MenuList {...props} className="">
      {scopes && scopes.length > 0 && (
        <div
          style={{
            padding: "12px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            position: "sticky",
            top: 0,
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >
          {scopes.map((scope: ScopeOption<any>) => {
            if (scope.type === "toggle") {
              return (
                <div
                  key={scope.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  {scope.label && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      {scope.label}
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {scope.options.map((option, index) => {
                      const isActive = activeScopes[scope.id] === option.id;
                      const isFirst = index === 0;
                      const isLast = index === scope.options.length - 1;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onMouseDown={(e) => {
                            // Prevent react-select from closing the menu on button click
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={() => onScopeChange(scope.id, option.id)}
                          style={{
                            padding: "3px 10px",
                            borderRadius: isFirst
                              ? "6px 0 0 6px"
                              : isLast
                              ? "0 6px 6px 0"
                              : "0",
                            marginLeft: isFirst ? 0 : "-1px",
                            position: "relative",
                            zIndex: isActive ? 1 : 0,
                            fontSize: "12px",
                            cursor: "pointer",
                            border: isActive
                              ? "1px solid #3b82f6"
                              : "1px solid #cbd5e1",
                            backgroundColor: isActive ? "#eff6ff" : "#ffffff",
                            color: isActive ? "#1d4ed8" : "#475569",
                            fontWeight: isActive ? 600 : 400,
                            outline: "none"
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
      {props.children}
    </components.MenuList>
  );
};

/**
 * A generalized, asynchronously loaded resource select component powered by `react-select` that
 * contains customizable search filters within the dropdown menu.
 *
 * For example, a toggle can be added to the top of the dropdown menu where you can define the group
 * scope:
 *
 * ```text
 * ┌──────────────────────────┐
 * │ Scope                    │
 * │ (My Groups | All Groups) │
 * ├──────────────────────────┤
 * │ Item A                   │
 * │ Item B                   │
 * │ Item C                   │
 * └──────────────────────────┘
 * ```
 */
export function ScopedResourceSelect<TData extends KitsuResource>({
  apiEndpoint,
  scopes,
  searchField,
  optionLabel,
  value,
  onChange,
  onOptionListLoaded,
  defaultScopes,
  isMulti = false,
  isDisabled = false,
  placeholder = "Select item...",
  pageSize = 10,
  sort = "-createdOn",
  include,
  additionalFilter,
  selectProps
}: ScopedResourceSelectProps<TData>) {
  const [inputValue, setInputValue] = useState("");
  const [searchValue] = useDebounce(inputValue, 250);

  // Initialize active states for all scopes
  const [activeScopes, setActiveScopes] = useState<Record<string, string>>(
    () => {
      const initialState = { ...defaultScopes };
      scopes?.forEach((scope) => {
        if (
          scope.type === "toggle" &&
          !initialState[scope.id] &&
          scope.options.length > 0
        ) {
          initialState[scope.id] = scope.options[0].id; // Default to first toggle option
        }
      });
      return initialState;
    }
  );

  // Build Kitsu JSONAPI filter query
  const filter = useMemo(() => {
    const builder = SimpleSearchFilterBuilder.create<TData>();

    // If the user is performing a search, include a filter for it.
    if (searchField && searchValue) {
      builder.searchFilter(searchField as keyof TData, searchValue);
    }

    // Apply active filter for each scope independently
    scopes?.forEach((scope) => {
      if (scope.type === "toggle") {
        const activeOptionId = activeScopes[scope.id];
        const activeOption = scope.options.find(
          (opt) => opt.id === activeOptionId
        );
        if (activeOption) {
          activeOption.applyFilter(builder);
        }
      }
    });

    // If additional filters exist, add them on.
    if (additionalFilter) {
      builder.add(additionalFilter);
    }

    return builder.build();
  }, [searchValue, activeScopes, scopes, searchField, additionalFilter]);

  // Fetch resources
  const querySpec: JsonApiQuerySpec = {
    path: apiEndpoint,
    filter,
    page: { limit: pageSize },
    sort,
    include
  };

  const { loading: queryIsLoading, response } = useQuery<TData[]>(querySpec);
  const isLoading = queryIsLoading || inputValue !== searchValue;

  // Trigger callback whenever options finish loading
  useEffect(() => {
    if (!queryIsLoading && response?.data) {
      onOptionListLoaded?.(response?.data as any);
    }
  }, [queryIsLoading, response?.data, onOptionListLoaded]);

  // Map backend response to option format
  const options: ResourceOption<TData>[] = useMemo(() => {
    return (
      response?.data?.map((resource) => ({
        label: optionLabel(resource as any) ?? String((resource as any).id),
        value: String(resource.id),
        resource: resource as any
      })) ?? []
    );
  }, [response?.data, optionLabel]);

  // Transform controlled `value` prop into option objects
  const selectValue = useMemo(() => {
    if (!value) return isMulti ? [] : null;
    const valueArray = Array.isArray(value) ? value : [value];

    const formatted = valueArray.map((res) => ({
      label: optionLabel(res) ?? String(res.id),
      value: String(res.id),
      resource: res
    }));

    return isMulti ? formatted : formatted[0] ?? null;
  }, [value, isMulti, optionLabel]);

  // Selection Handler
  const handleChange = (
    newValue:
      | SingleValue<ResourceOption<TData>>
      | MultiValue<ResourceOption<TData>>,
    actionMeta: ActionMeta<ResourceOption<TData>>
  ) => {
    if (!newValue) {
      onChange?.(isMulti ? [] : null, actionMeta);
      return;
    }

    if (Array.isArray(newValue)) {
      const resources = newValue.map((opt) => opt.resource);
      onChange?.(resources, actionMeta);
    } else {
      const singleOpt = newValue as ResourceOption<TData>;
      onChange?.(singleOpt.resource, actionMeta);
    }
  };

  const handleScopeChange = (scopeId: string, optionId: string) => {
    setActiveScopes((prev) => ({
      ...prev,
      [scopeId]: optionId
    }));
  };

  return (
    <Select<ResourceOption<TData>, boolean>
      isMulti={isMulti}
      isDisabled={isDisabled}
      isLoading={isLoading}
      inputValue={inputValue}
      value={selectValue}
      options={options}
      placeholder={placeholder}
      onInputChange={(val, meta) => {
        if (meta.action === "input-change") {
          setInputValue(val);
        }
      }}
      onChange={handleChange}
      filterOption={() => true}
      components={{ MenuList: ScopedMenuList }}
      {...selectProps}
      {...({
        scopes,
        activeScopes,
        onScopeChange: handleScopeChange
      } as any)}
    />
  );
}
