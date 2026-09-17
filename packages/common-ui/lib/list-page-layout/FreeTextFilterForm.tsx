import { useLocalStorage } from "@rehooks/local-storage";
import classNames from "classnames";
import { FormikProps } from "formik";
import _ from "lodash";
import { useEffect, useMemo } from "react";
import { FilterAttribute } from "../filter-builder/FilterBuilder";
import { DinaForm, DinaFormOnSubmit } from "../formik-connected/DinaForm";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { CommonMessage } from "../intl/common-ui-intl";
import { FilterFreeTextSearchField } from "../filter-free-text-search/FilterFreeTextSearchField";
import { FaArrowRotateLeft, FaFilter } from "react-icons/fa6";

/* How long to wait after the last keystroke before a live search is submitted. */
const LIVE_SEARCH_DELAY_MS = 300;

interface FreeTextFilterFormProps {
  children?: (formik: FormikProps<any>) => React.ReactElement;
  filterAttributes: FilterAttribute[];
  /* Unique ID for this form's name. */
  id: string;
  onFilterFormSubmit?: (values: any) => void;

  /* CSS classes added to the form's layout wrapper, e.g. "list-filter-panel". */
  className?: string;

  /* Placeholder text shown while the search input is empty. */
  placeholder?: string;

  /**
   * Submits the form automatically (debounced) as the user types in the search input,
   * so the results update without pressing the "Filter List" button.
   * Intended for in-memory filtered lists, where re-filtering is cheap.
   */
  liveSearch?: boolean;
}

/* Formik form with the free-text search field. */
export function FreeTextFilterForm({
  children,
  filterAttributes,
  id,
  onFilterFormSubmit = _.noop,
  className,
  placeholder,
  liveSearch = false
}: FreeTextFilterFormProps) {
  const filterformKey = `${id}_filterForm`;
  const [filterForm, setFilterForm, removeFilterForm] = useLocalStorage(
    filterformKey,
    {}
  );

  // The debounced call receives the latest submitForm, so it always submits the current form.
  const debouncedSubmit = useMemo(
    () =>
      _.debounce(
        (submitForm: () => Promise<any>) => submitForm(),
        LIVE_SEARCH_DELAY_MS
      ),
    []
  );

  // Don't submit after the form is unmounted
  useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

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
    // Discard any pending live search so it doesn't re-apply the old text after the reset
    debouncedSubmit.cancel();
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
        <div
          className={classNames("d-flex gap-3 flex-wrap mb-3", className)}
          translate={undefined}
        >
          <div>
            <div className="field-label label-col mb-2">
              <strong>
                <CommonMessage id="filterRecordsTitle" />
              </strong>
            </div>
            <FilterFreeTextSearchField
              filterAttributes={filterAttributes}
              name="filterBuilderModel"
              placeholder={placeholder}
              onValueChange={
                liveSearch
                  ? () => debouncedSubmit(formikProps.submitForm)
                  : undefined
              }
            />
          </div>
          <div>{children && children(formikProps)}</div>
          <div className="filter-form-buttons d-flex gap-2 align-items-center">
            <SubmitButton className="list-inline-item" showSaveIcon={false}>
              <FaFilter className="me-2" />
              <CommonMessage id="filterSubmitButtonText" />
            </SubmitButton>
            <button
              className="btn btn-dark list-inline-item filter-reset-button"
              type="button"
              onClick={() => resetFilterForm(formikProps)}
            >
              <FaArrowRotateLeft className="me-2" />
              <CommonMessage id="resetFilters" />
            </button>
          </div>
        </div>
      )}
    </DinaForm>
  );
}
