import {
  FilterParam,
  KitsuResource,
  KitsuResourceLink,
  PersistedResource
} from "kitsu";
import { castArray, compact, isEqual, isUndefined, keys, omitBy } from "lodash";
import React, { ComponentProps, useState } from "react";
import { useIntl } from "react-intl";
import Select, {
  components as reactSelectComponents,
  StylesConfig,
  ActionMeta
} from "react-select";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import { useDebounce } from "use-debounce";
import { SelectOption, useAccount } from "../..";
import { JsonApiQuerySpec, useQuery } from "../api-client/useQuery";
import { useBulkGet } from "./useBulkGet";

/** ResourceSelect component props. */
export interface ResourceSelectProps<TData extends KitsuResource> {
  /** Sets the input's value so the value can be controlled externally. */
  value?: ResourceSelectValue<TData>;

  /** Function called when an option is selected. */
  onChange?: (
    value: PersistedResource<TData> | PersistedResource<TData>[],
    actionMeta?: ActionMeta<{ resource: PersistedResource<TData> }>
  ) => void;

  /** The model type to select resources from. */
  model: string;

  /** Function to get the option label for each resource. */
  optionLabel: (resource: PersistedResource<TData>) => string | null;

  /** Function that is passed the dropdown's search input value and returns a JSONAPI filter param. */
  filter: (inputValue: string) => FilterParam;

  filterList?: (item: any | undefined) => boolean;

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

  selectProps?: Partial<ComponentProps<typeof Select>>;

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
  cannotBeChanged
}: ResourceSelectProps<TData>) {
  const { formatMessage } = useIntl();
  const { isAdmin } = useAccount();

  /** The value of the input element. */
  const [inputValue, setInputValue] = useState("");

  /** The debounced input value passed to the fetcher. */
  const [searchValue] = useDebounce(inputValue, 250);

  // Omit blank/null filters:
  const filterParam = omitBy(filter(searchValue), (val) =>
    ["", undefined].includes(val as string)
  );

  let isDisabled = isDisabledProp;

  // "6" is chosen here to give enough room for the main options, the <none> option, and the
  const page = { limit: pageSize ?? 6 };
  const sort = !removeDefaultSort ? "-createdOn" : undefined;

  // Omit undefined values from the GET params, which would otherwise cause an invalid request.
  // e.g. /api/region?include=undefined
  const querySpec: JsonApiQuerySpec = {
    path: model,
    ...omitBy(
      { filter: filterParam, include, page, sort },
      (val) => isUndefined(val) || isEqual(val, {})
    )
  };

  const { loading: queryIsLoading, response } =
    useCustomQuery?.(inputValue, querySpec) ?? useQuery<TData[]>(querySpec);

  const isLoading = queryIsLoading || inputValue !== searchValue || loadingProp;

  // Build the list of options from the returned resources.
  const resourceOptions =
    response?.data.map((resource) => ({
      label: optionLabel(resource),
      resource,
      value: resource.id
    })) ?? [];

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
      ...resourceOptions
    ]
  };

  const actionOptions = asyncOptions && {
    label: formatMessage({ id: "actions" }),
    options: asyncOptions
  };

  // Show no options while loading: (react-select will show the "Loading..." text.)
  const options = isLoading ? [] : compact([mainOptions, actionOptions]);

  async function onChange(
    newSelectedRaw,
    actionMeta: ActionMeta<{ resource: PersistedResource<TData> }>
  ) {
    const newSelected = castArray(newSelectedRaw);

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

  const onSortEnd = ({ oldIndex, newIndex }) => {
    onChangeProp(
      arrayMove((value ?? []) as PersistedResource<any>[], oldIndex, newIndex)
    );
  };

  const valueAsArray = compact(castArray(value));

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
    menu: (base) => ({ ...base, zIndex: 1050 }),
    // Make the menu's height fit the resource options and the action options:
    menuList: (base) => ({ ...base, maxHeight: "400px" }),
    group: (base, gProps) => ({
      ...base,
      // Make Action options bold:
      ...(gProps.label === actionOptions?.label ? { fontWeight: "bold" } : {})
    })
  };

  return (
    <SortableSelect
      // react-select AsyncSelect props:
      isMulti={isMulti}
      onInputChange={(newVal) => setInputValue(newVal)}
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
      // react-sortable-hoc config:
      axis="xy"
      onSortEnd={onSortEnd}
      components={{
        MultiValue: SortableMultiValue
      }}
      distance={4}
      {...selectProps}
    />
  );
}

// Drag/drop re-ordering support copied from https://github.com/JedWatson/react-select/pull/3645/files
function arrayMove(array: any[], from: number, to: number) {
  array = array.slice();
  array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
  return array;
}
const SortableMultiValue = SortableElement(reactSelectComponents.MultiValue);
const SortableSelect = SortableContainer(Select);

export function isShallowReference(resourceArray: any[]) {
  const firstElement = castArray(resourceArray)[0];
  return (
    !!firstElement?.id && isEqual(keys(firstElement).sort(), ["id", "type"])
  );
}
