import { FastField, FieldProps } from "formik";
import { KitsuResource } from "kitsu";
import { noop } from "lodash";
import {
  ResourceSelect,
  ResourceSelectProps
} from "../resource-select/ResourceSelect";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface ResourceSelectFieldProps<TData>
  extends Omit<ResourceSelectProps<TData>, "value">,
    LabelWrapperParams {
  onChange?: (value?: TData) => void;
}

/** Formik-connected Dropdown select input for selecting a resource from the API. */
export function ResourceSelectField<TData extends KitsuResource>(
  topLevelProps: ResourceSelectFieldProps<TData>
) {
  const {
    className,
    hideLabel,
    name,
    label,
    onChange = noop,
    tooltipMsg
  } = topLevelProps;

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
          <FieldWrapper
            className={className}
            hideLabel={hideLabel}
            name={name}
            label={label}
            tooltipMsg={tooltipMsg}
          >
            <ResourceSelect
              {...topLevelProps}
              onChange={onChangeInternal}
              value={value}
            />
          </FieldWrapper>
        );
      }}
    </FastField>
  );
}
