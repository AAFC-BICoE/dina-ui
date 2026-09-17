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

  /* Placeholder text shown while the search input is empty. */
  placeholder?: string;

  /* Called with the new search text on every keystroke, e.g. to search as the user types. */
  onValueChange?: (value: string) => void;
}

export function FilterFreeTextSearchField({
  name,
  filterAttributes,
  placeholder,
  onValueChange
}: FilterFreeTextSearchFieldProps) {
  return (
    <Field name={name}>
      {({
        field: { value },
        form: { setFieldValue, setFieldTouched }
      }: FieldProps) => {
        function onChange(e) {
          const newValue = (e.target as HTMLTextAreaElement | HTMLInputElement)
            .value;
          const filterModel: FreeTextSearchFilterModel = {
            type: "FREE_TEXT_SEARCH_FILTER",
            filterAttributes,
            value: newValue
          };
          setFieldValue(name, filterModel);
          setFieldTouched(name);
          onValueChange?.(newValue);
        }
        return (
          <div className="list-inline" style={{ display: "flex-shrink" }}>
            <div className="list-inline-item">
              <input
                name={name}
                type="text"
                aria-label="Filter Value"
                className="filter-value form-control d-inline-block search-input w-100"
                placeholder={placeholder}
                value={value?.value ?? ""}
                onChange={onChange}
              />
            </div>
          </div>
        );
      }}
    </Field>
  );
}
