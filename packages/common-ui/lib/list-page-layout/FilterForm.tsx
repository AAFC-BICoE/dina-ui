import { useLocalStorage } from "@rehooks/local-storage";
import { FormikProps } from "formik";
import { cloneDeep, noop } from "lodash";
import { useEffect } from "react";
import { FilterAttribute } from "../filter-builder/FilterBuilder";
import { FilterBuilderField } from "../filter-builder/FilterBuilderField";
import { DinaForm, DinaFormOnSubmit } from "../formik-connected/DinaForm";
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

  const onFilterFormSubmitInternal: DinaFormOnSubmit = ({
    submittedValues,
    formik: { setSubmitting }
  }) => {
    // On submit, put the filter form's values into local storage.
    setFilterForm(cloneDeep(submittedValues));
    setSubmitting(false);
    onFilterFormSubmit(submittedValues);
  };

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
    <DinaForm initialValues={filterForm} onSubmit={onFilterFormSubmitInternal}>
      {formikProps => (
        <div className="mb-3" translate={undefined}>
          <div className="mb-3">
            <strong>
              <CommonMessage id="filterRecordsTitle" />
            </strong>
            <FilterBuilderField
              filterAttributes={filterAttributes}
              name="filterBuilderModel"
            />
          </div>
          <div className="d-inline-block">
            {children && children(formikProps)}
          </div>
          <div className="d-inline-block ps-3 list-inline">
            <SubmitButton className="list-inline-item">
              <CommonMessage id="filterSubmitButtonText" />
            </SubmitButton>
            <button
              className="btn btn-dark list-inline-item filter-reset-button"
              type="button"
              onClick={() => resetFilterForm(formikProps)}
            >
              <CommonMessage id="resetButtonText" />
            </button>
          </div>
        </div>
      )}
    </DinaForm>
  );
}
