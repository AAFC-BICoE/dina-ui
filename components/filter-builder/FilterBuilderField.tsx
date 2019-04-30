import { Field, FieldProps } from "formik";
import { FilterBuilder } from "./FilterBuilder";
import { FilterGroupModel } from "./FilterGroup";

interface FilterBuilderFieldProps {
  filterAttributes: string[];
  name: string;
}

export function FilterBuilderField({
  filterAttributes,
  name
}: FilterBuilderFieldProps) {
  return (
    <Field name={name}>
      {({ form: { setFieldValue, setFieldTouched } }: FieldProps) => {
        function onChange(filterObject: FilterGroupModel) {
          setFieldValue(name, filterObject);
          setFieldTouched(name);
        }
        return (
          <FilterBuilder
            filterAttributes={filterAttributes}
            onChange={onChange}
          />
        );
      }}
    </Field>
  );
}
