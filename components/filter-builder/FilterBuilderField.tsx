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
      {({
        field: { value },
        form: { setFieldValue, setFieldTouched }
      }: FieldProps) => {
        function onChange(filterObject: FilterGroupModel) {
          setFieldValue(name, filterObject);
          setFieldTouched(name);
        }
        return (
          <FilterBuilder
            filterAttributes={filterAttributes}
            value={value}
            onChange={onChange}
          />
        );
      }}
    </Field>
  );
}
