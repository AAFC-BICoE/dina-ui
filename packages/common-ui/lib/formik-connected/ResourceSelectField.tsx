import { FastField, FieldProps } from "formik";
import { KitsuResource, PersistedResource } from "kitsu";
import { noop } from "lodash";
import {
  ResourceSelect,
  ResourceSelectProps
} from "../resource-select/ResourceSelect";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface ResourceSelectFieldProps<TData extends KitsuResource>
  extends Omit<ResourceSelectProps<TData>, "value">,
    LabelWrapperParams {
  onChange?: (
    value?: PersistedResource<TData> | Array<PersistedResource<TData>>
  ) => void;
}

/** Formik-connected Dropdown select input for selecting a resource from the API. */
export function ResourceSelectField<TData extends KitsuResource>(
  resourceSelectFieldProps: ResourceSelectFieldProps<TData>
) {
  const {
    name,
    onChange = noop,
    ...resourceSelectProps
  } = resourceSelectFieldProps;

  return (
    <FastField name={name}>
      {({
        field: { value },
        form: { setFieldValue, setFieldTouched }
      }: FieldProps) => {
        function onChangeInternal(resource) {
          setFieldValue(name, resource);
          setFieldTouched(name);
          onChange(resource);
        }

        return (
          <FieldWrapper {...resourceSelectFieldProps}>
            <ResourceSelect
              {...resourceSelectProps}
              onChange={onChangeInternal}
              value={value}
            />
          </FieldWrapper>
        );
      }}
    </FastField>
  );
}
