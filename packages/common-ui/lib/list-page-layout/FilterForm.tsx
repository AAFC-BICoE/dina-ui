import { useLocalStorage } from "@rehooks/local-storage";
import { Form, Formik, FormikProps } from "formik";
import { cloneDeep, noop } from "lodash";
import { useEffect } from "react";
import { FilterAttribute } from "../filter-builder/FilterBuilder";
import { FilterBuilderField } from "../filter-builder/FilterBuilderField";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { CommonMessage } from "../intl/common-ui-intl";

interface FilterFormProps {
  children?: (formik: FormikProps<any>) => React.ReactElement;
  filterAttributes: FilterAttribute[];
  /** Unique ID for this form's name. */
  id: string;
  onFilterFormSubmit?: (values: any) => void;
}

/** Formik form with the filter builder field. */
export function FilterForm({
  children,
  filterAttributes,
  id,
  onFilterFormSubmit = noop
}: FilterFormProps) {
  const filterformKey = `${id}_filterForm`;
  const [filterForm, setFilterForm, removeFilterForm] = useLocalStorage(
    filterformKey,
    {}
  );

  function onFilterFormSubmitInternal(values, { setSubmitting }) {
    // On submit, put the filter form's values into local storage.
    setFilterForm(cloneDeep(values));
    setSubmitting(false);
    onFilterFormSubmit(values);
  }

  function resetFilterForm({ setValues }: FormikProps<any>) {
    removeFilterForm();
    setValues({});
    onFilterFormSubmit({});
  }

  useEffect(() => {
    // Submit the form on mount to provide the stored filter to the parent component.
    onFilterFormSubmit(filterForm);
  }, []);

  return (
    <Formik initialValues={filterForm} onSubmit={onFilterFormSubmitInternal}>
      {formikProps => (
        <Form className="form-group">
          <div className="form-group">
            <strong>Filter records:</strong>
            <FilterBuilderField
              filterAttributes={filterAttributes}
              name="filterBuilderModel"
            />
          </div>
          <div className="d-inline-block">
            {children && children(formikProps)}
          </div>
          <div className="d-inline-block pl-3">
            <SubmitButton>
              <CommonMessage id="filterSubmitButtonText" />
            </SubmitButton>
            <button
              className="btn btn-dark filter-reset-button"
              type="button"
              onClick={() => resetFilterForm(formikProps)}
            >
              <CommonMessage id="resetButtonText" />
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
