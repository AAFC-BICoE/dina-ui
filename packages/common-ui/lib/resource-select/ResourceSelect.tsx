import {
  FilterParam,
  GetParams,
  KitsuResource,
  PersistedResource
} from "kitsu";
import { debounce, isEqual, isUndefined, omitBy } from "lodash";
import React, { useEffect, useCallback, useState } from "react";
import { useIntl } from "react-intl";
import { components as reactSelectComponents } from "react-select";
import Select from "react-select";
import { Styles } from "react-select/src/styles";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import { SelectOption } from "../..";
import { useQuery } from "../api-client/useQuery";

/** ResourceSelect component props. */
export interface ResourceSelectProps<TData extends KitsuResource> {
  /** Sets the input's value so the value can be controlled externally. */
  value?: TData | TData[];

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
  styles?: Partial<Styles<SelectOption<any>, boolean>>;

  /** Special dropdown options that can fetch an async value e.g. by creating a resource in a modal. */
  asyncOptions?: AsyncOption<TData>[];

  isDisabled?: boolean;

  /** Omits the "<none>" option. */
  omitNullOption?: boolean;

  invalid?: boolean;
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
  invalid
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

  // Omit undefined values from the GET params, which would otherwise cause an invalid request.
  // e.g. /api/region?include=undefined
  const getParams = omitBy<GetParams>(
    { filter: filterParam, include, sort },
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

  async function onChangeSingle(selectedOption) {
    if (selectedOption?.getResource) {
      const resource = await (
        selectedOption as AsyncOption<TData>
      ).getResource();
      if (resource) {
        onChangeProp(resource);
      }
    } else if (selectedOption?.resource) {
      onChangeProp(selectedOption.resource);
    }
  }

  async function onChangeMulti(selectedOptions: any[] | null) {
    const asyncOption: AsyncOption<TData> = selectedOptions?.find(
      option => option?.getResource
    );

    if (asyncOption && selectedOptions) {
      // For callback options, don't set any value:
      const asyncResource = await asyncOption.getResource();
      if (asyncResource) {
        const newResources = selectedOptions.map(option =>
          option === asyncOption ? asyncResource : option.resource
        );
        onChangeProp(newResources);
      }
    } else {
      const resources = selectedOptions?.map(o => o.resource) || [];
      onChangeProp(resources);
    }
  }

  const onSortEnd = ({ oldIndex, newIndex }) => {
    onChangeProp(
      arrayMove((value ?? []) as PersistedResource<any>[], oldIndex, newIndex)
    );
  };

  // Set the component's value externally when used as a controlled input.
  let selectValue;
  if (isMulti) {
    const isArr = Array.isArray(value);
    selectValue = (
      (isArr
        ? value
        : // tslint:disable-next-line: no-string-literal
          (value ? value["data"] : []) || []) as PersistedResource<TData>[]
    ).map(resource => ({
      label: optionLabel(resource),
      resource,
      value: resource.id
    }));
  } else {
    selectValue = !value
      ? null
      : (value as TData).id === null
      ? NULL_OPTION
      : {
          label: optionLabel(value as PersistedResource<TData>),
          resource: value,
          value: (value as TData).id
        };
  }

  const customStyle: any = {
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
      onChange={isMulti ? onChangeMulti : onChangeSingle}
      isLoading={isLoading}
      options={options}
      placeholder={formatMessage({ id: "typeHereToSearch" })}
      styles={{
        ...styles,
        ...customStyle
      }}
      value={selectValue}
      isDisabled={isDisabled}
      // react-sortable-hoc config:
      axis="xy"
      onSortEnd={onSortEnd}
      components={{
        MultiValue: SortableMultiValue
      }}
      distance={4}
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
