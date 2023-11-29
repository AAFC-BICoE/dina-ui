import { Field, FieldProps } from "formik";
import { FilterAttribute } from "../filter-builder/FilterBuilder";

export interface FreeTextSearchFilterModel {
  type: "FREE_TEXT_SEARCH_FILTER";
  value: string;
  filterAttributes: FilterAttribute[];
}

interface FilterFreeTextSearchFieldProps {
  name: string;
  filterAttributes: FilterAttribute[];
}

export function FilterFreeTextSearchField({
  name,
  filterAttributes,
}: FilterFreeTextSearchFieldProps) {
  return (
    <Field name={name}>
      {({
        field: { value },
        form: { setFieldValue, setFieldTouched }
      }: FieldProps) => {
        function onChange(e) {
          const filterModel: FreeTextSearchFilterModel = {
            type: 'FREE_TEXT_SEARCH_FILTER',
            filterAttributes,
            value: e.target.value,
          }
          setFieldValue(name, filterModel);
          setFieldTouched(name);
        }
        return (
          <div className="list-inline" style={{ display: "flex-shrink" }}>
            <div className="list-inline-item">
            <input
              name={name}
              type="text"
              aria-label="Filter Value"
              className="filter-value form-control d-inline-block search-input w-100"
              value={ value?.value ?? "" }
              onChange={onChange}
            />
            </div>
          </div>
        );
      }}
    </Field>
  );
}
