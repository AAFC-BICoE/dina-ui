import { Field, FieldProps } from "formik";
import { KitsuResource } from "kitsu";
import {
  ResourceSelect,
  ResourceSelectProps
} from "../resource-select/ResourceSelect";
import { FieldWrapper, LabelParams } from "./FieldWrapper";

export interface ResourceSelectFieldProps<TData>
  extends ResourceSelectProps<TData>,
    LabelParams {
  // These props are not required when using this Formik-controlled input.
  onChange?: never;
  value?: never;
}

export function ResourceSelectField<TData extends KitsuResource>(
  topLevelProps: ResourceSelectFieldProps<TData>
) {
  const { className, name, label } = topLevelProps;

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
          <FieldWrapper className={className} name={name} label={label}>
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
