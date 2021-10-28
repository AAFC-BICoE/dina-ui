import {
  FilterParam,
  GetParams,
  KitsuResource,
  KitsuResourceLink,
  PersistedResource
} from "kitsu";
import {
  castArray,
  compact,
  debounce,
  isEqual,
  isUndefined,
  keys,
  omitBy
} from "lodash";
import React, { ComponentProps, useCallback, useEffect, useState } from "react";
import { useIntl } from "react-intl";
import Select, {
  StylesConfig,
  components as reactSelectComponents
} from "react-select";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import { SelectOption } from "../..";
import { useQuery } from "../api-client/useQuery";
import { useBulkGet } from "./useBulkGet";

/** ResourceSelect component props. */
export interface ResourceSelectProps<TData extends KitsuResource> {
  /** Sets the input's value so the value can be controlled externally. */
  value?:
    | PersistedResource<TData>
    | PersistedResource<TData>[]
    | KitsuResourceLink;

  /** Function called when an option is selected. */
  onChange?: (
    value: PersistedResource<TData> | PersistedResource<TData>[]
  ) => void;

  /** The model type to select resources from. */
  model: string;

  /** Function to get the option label for each resource. */
  optionLabel: (resource: PersistedResource<TData>) => string;

  /** Function that is passed the dropdown's search input value and returns a JSONAPI filter param. */
  filter: (inputValue: string) => FilterParam;

  /** Whether this is a multi-select dropdown. */
  isMulti?: boolean;

  /** The JSONAPI "include" parameter. */
  include?: string;

  /** The JSONAPI "sort" parameter. */
  sort?: string;

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
}

/**
 * Special dropdown option that can fetch an async value.
 * e.g. setting a resource after the user created it through a modal.
 */
export interface AsyncOption<TData extends KitsuResource> {
  /** Option label. */
  label: JSX.Element;

  /**
   * Function called to fetch the resource when the option is selected.
   * Returning undefined doesn't set the value.
   */
  getResource: () => Promise<PersistedResource<TData> | undefined>;
}

/** An option the user can select to set the relationship to null. */
const NULL_OPTION = Object.seal({
  label: "<none>",
  resource: Object.seal({ id: null }),
  value: null
});

/** Dropdown select input for selecting a resource from the API. */
export function ResourceSelect<TData extends KitsuResource>({
  filter,
  include,
  isMulti = false,
  model,
  onChange: onChangeProp = () => undefined,
  optionLabel,
  sort,
  styles,
  value,
  asyncOptions,
  isDisabled,
  omitNullOption,
  invalid,
  selectProps,
  pageSize
}: ResourceSelectProps<TData>) {
  const { formatMessage } = useIntl();

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

  // Omit blank/null filters:
  const filterParam = omitBy(filter(search.value), val =>
    ["", null, undefined].includes(val as string)
  ) as FilterParam;

  const page = pageSize ? { limit: pageSize } : undefined;

  // Omit undefined values from the GET params, which would otherwise cause an invalid request.
  // e.g. /api/region?include=undefined
  const getParams = omitBy<GetParams>(
    { filter: filterParam, include, sort, page },
    val => isUndefined(val) || isEqual(val, {})
  );

  const { loading: queryIsLoading, response } = useQuery<TData[]>({
    path: model,
    ...getParams
  });

  const isLoading = queryIsLoading || search.input !== search.value;

  // Build the list of options from the returned resources.
  const resourceOptions =
    response?.data.map(resource => ({
      label: optionLabel(resource),
      resource,
      value: resource.id
    })) ?? [];

  // Only show the null option when in single-resource mode and when there is no search input value.
  const options = [
    ...(!isMulti && !search.value && !omitNullOption ? [NULL_OPTION] : []),
    ...resourceOptions,
    ...(asyncOptions
      ? asyncOptions.map(option => ({
          ...option,
          label: <strong>{option.label}</strong>
        }))
      : [])
  ];

  async function onChange(newSelectedRaw) {
    const newSelected = castArray(newSelectedRaw);

    // If an async option is selected:
    const asyncOption: AsyncOption<TData> | undefined = newSelected?.find(
      option => option?.getResource
    );

    if (asyncOption && newSelectedRaw) {
      // For callback options, don't set any value:
      const asyncResource = await asyncOption.getResource();
      if (asyncResource) {
        const newResources = newSelected.map(option =>
          option === asyncOption ? asyncResource : option.resource
        );
        onChangeProp(isMulti ? newResources : newResources[0]);
      }
    } else {
      const resources = newSelected?.map(o => o.resource) || [];
      onChangeProp(isMulti ? resources : resources[0]);
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
      ids: valueAsArray.map(it => String(it.id)),
      listPath: model,
      disabled: !valueIsShallowReference
    }).data ?? valueAsArray;

  // Convert the field value to react-select option objects:
  const selectedAsArray = selectedResources.map(resource => {
    if (!resource) {
      return null;
    }
    if (resource.id === null) {
      return NULL_OPTION;
    }
    return {
      label: optionLabel(resource as PersistedResource<TData>) ?? resource.id,
      resource,
      value: resource.id
    };
  });
  const selectValue = isMulti ? selectedAsArray : selectedAsArray[0] ?? null;

  const customStyle: any = {
    ...styles,
    multiValueLabel: base => ({ ...base, cursor: "move" }),
    placeholder: base => ({ ...base, color: "rgb(87,120,94)" }),
    control: base => ({
      ...base,
      ...(invalid && {
        borderColor: "rgb(148, 26, 37)",
        "&:hover": { borderColor: "rgb(148, 26, 37)" }
      })
    })
  };

  return (
    <SortableSelect
      // react-select AsyncSelect props:
      isMulti={isMulti}
      onInputChange={newVal =>
        setSearch(current => ({ ...current, input: newVal }))
      }
      inputValue={search.input}
      onChange={onChange}
      isLoading={isLoading}
      options={options}
      placeholder={formatMessage({ id: "typeHereToSearch" })}
      styles={customStyle}
      value={selectValue}
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
