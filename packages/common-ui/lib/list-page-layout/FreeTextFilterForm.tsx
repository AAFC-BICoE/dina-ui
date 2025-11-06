import { useLocalStorage } from "@rehooks/local-storage";
import { FormikProps } from "formik";
import _ from "lodash";
import { useEffect } from "react";
import { FilterAttribute } from "../filter-builder/FilterBuilder";
import { DinaForm, DinaFormOnSubmit } from "../formik-connected/DinaForm";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { CommonMessage } from "../intl/common-ui-intl";
import { FilterFreeTextSearchField } from "../filter-free-text-search/FilterFreeTextSearchField";

interface FreeTextFilterFormProps {
  children?: (formik: FormikProps<any>) => React.ReactElement;
  filterAttributes: FilterAttribute[];
  /** Unique ID for this form's name. */
  id: string;
  onFilterFormSubmit?: (values: any) => void;
}

/** Formik form with the filter builder field. */
export function FreeTextFilterForm({
  children,
  filterAttributes,
  id,
  onFilterFormSubmit = _.noop
}: FreeTextFilterFormProps) {
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
    setFilterForm(_.cloneDeep(submittedValues));
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
      {(formikProps) => (
        <div className="d-flex gap-3 flex-wrap mb-3" translate={undefined}>
          <div>
            <div className="field-label label-col mb-2">
              <strong>
                <CommonMessage id="filterRecordsTitle" />
              </strong>
            </div>
            <FilterFreeTextSearchField
              filterAttributes={filterAttributes}
              name="filterBuilderModel"
            />
          </div>
          <div>{children && children(formikProps)}</div>
          <div className="align-end ps-3 d-flex gap-2 align-items-center">
            <SubmitButton className="list-inline-item" showSaveIcon={false}>
              <CommonMessage id="filterSubmitButtonText" />
            </SubmitButton>
            <button
              className="btn btn-dark list-inline-item filter-reset-button"
              type="button"
              onClick={() => resetFilterForm(formikProps)}
            >
              <CommonMessage id="resetFilters" />
            </button>
          </div>
        </div>
      )}
    </DinaForm>
  );
}
