import { Field, FieldProps } from "formik";
import { KitsuResource } from "kitsu";
import {
  ResourceSelect,
  ResourceSelectProps
} from "../resource-select/ResourceSelect";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";

export interface ResourceSelectFieldProps<TData>
  extends ResourceSelectProps<TData>,
    LabelWrapperParams {
  // These props are not required when using this Formik-controlled input.
  onChange?: never;
  value?: never;
  tooltipMsg?: string;
}

/** Formik-connected Dropdown select input for selecting a resource from the API. */
export function ResourceSelectField<TData extends KitsuResource>(
  topLevelProps: ResourceSelectFieldProps<TData>
) {
  const { className, name, label, tooltipMsg } = topLevelProps;

  return (
    <Field name={name}>
      {({
        field: { value },
        form: { setFieldValue, setFieldTouched }
      }: FieldProps) => {
        function onChange(resource) {
          setFieldValue(name, resource);
          setFieldTouched(name);
        }

        return (
          <FieldWrapper
            className={className}
            name={name}
            label={label}
            tooltipMsg={tooltipMsg}
          >
            <ResourceSelect
              {...topLevelProps}
              onChange={onChange}
              value={value}
            />
          </FieldWrapper>
        );
      }}
    </Field>
  );
}
