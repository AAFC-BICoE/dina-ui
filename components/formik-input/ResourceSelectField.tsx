import { Field, FieldProps } from "formik";
import { KitsuResource } from "kitsu";
import {
  ResourceSelect,
  ResourceSelectProps
} from "../resource-select/ResourceSelect";

export interface ResourceSelectFieldProps<TData>
  extends ResourceSelectProps<TData> {
  field: string;

  onChange?: never;
  value?: never;
}

export function ResourceSelectField<TData extends KitsuResource>(
  topLevelProps: ResourceSelectFieldProps<TData>
) {
  const { field } = topLevelProps;

  return (
    <Field name={field}>
      {({
        field: { value },
        form: { setFieldValue, setFieldTouched }
      }: FieldProps) => {
        function onChange(resource) {
          setFieldValue(field, resource);
          setFieldTouched(field);
        }

        return (
          <ResourceSelect
            {...topLevelProps}
            onChange={onChange}
            value={value}
          />
        );
      }}
    </Field>
  );
}
