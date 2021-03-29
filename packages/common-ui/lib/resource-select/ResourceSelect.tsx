import {
  FilterParam,
  GetParams,
  KitsuResource,
  PersistedResource
} from "kitsu";
import { debounce, isArray, isUndefined, omitBy } from "lodash";
import React, { useContext } from "react";
import { useIntl } from "react-intl";
import AsyncSelect from "react-select/async";
import { components as reactSelectComponents } from "react-select";
import { Styles } from "react-select/src/styles";
import { OptionsType } from "react-select/src/types";
import { ApiClientContext, SelectOption } from "../..";
import { SortableContainer, SortableElement } from "react-sortable-hoc";

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
const NULL_OPTION = { label: "<none>", resource: { id: null }, value: null };

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
  asyncOptions
}: ResourceSelectProps<TData>) {
  const { apiClient } = useContext(ApiClientContext);
  const { formatMessage } = useIntl();

  async function loadOptions(
    inputValue: string,
    callback: (options: OptionsType<any>) => void
  ) {
    const filterParam = inputValue ? filter(inputValue) : undefined;

    // Omit undefined values from the GET params, which would otherwise cause an invalid request.
    // e.g. /api/region?include=undefined
    const getParams = omitBy<GetParams>(
      { filter: filterParam, include, sort },
      isUndefined
    );

    // Send the API request.
    const { data } = await apiClient.get<TData[]>(model, getParams);

    // Build the list of options from the returned resources.
    const resourceOptions = data.map(resource => ({
      label: optionLabel(resource),
      resource,
      value: resource.id
    }));

    // Only show the null option when in single-resource mode and when there is no search input value.
    const options = [
      ...(!isMulti && !inputValue ? [NULL_OPTION] : []),
      ...resourceOptions,
      ...(asyncOptions
        ? asyncOptions.map(option => ({
            ...option,
            label: <strong>{option.label}</strong>
          }))
        : [])
    ];

    callback(options);
  }

  async function onChangeSingle(selectedOption) {
    if (selectedOption?.getResource) {
      const resource = await (selectedOption as AsyncOption<TData>).getResource();
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

  // Debounces the loadOptions function to avoid sending excessive API requests.
  const debouncedOptionLoader = debounce((inputValue, callback) => {
    loadOptions(inputValue, callback);
  }, 250);

  const onSortEnd = ({ oldIndex, newIndex }) => {
    onChangeProp(
      arrayMove((value ?? []) as PersistedResource<any>[], oldIndex, newIndex)
    );
  };

  // Set the component's value externally when used as a controlled input.
  let selectValue;
  if (isMulti) {
    const isArr = Array.isArray(value);
    selectValue = ((isArr
      ? value
      : // tslint:disable-next-line: no-string-literal
        (value ? value["data"] : []) || []) as PersistedResource<TData>[]).map(
      resource => ({
        label: optionLabel(resource),
        resource,
        value: resource.id
      })
    );
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

  return (
    <SortableSelect
      // react-select AsyncSelect props:
      defaultOptions={true}
      isMulti={isMulti}
      loadOptions={debouncedOptionLoader}
      onChange={isMulti ? onChangeMulti : onChangeSingle}
      placeholder={formatMessage({ id: "typeHereToSearch" })}
      styles={{
        multiValueLabel: base => ({ ...base, cursor: "move" }),
        ...styles
      }}
      value={selectValue}
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
const SortableSelect = SortableContainer(AsyncSelect);
