import { Form, Formik, FormikProps } from "formik";
import { noop } from "lodash";
import { useEffect } from "react";
import { useCookies } from "react-cookie";
import { CookieSetOptions } from "universal-cookie";
import { FilterAttribute, FilterBuilderField } from "..";

interface FilterFormProps {
  children?: (formik: FormikProps<any>) => React.ReactElement;
  filterAttributes: FilterAttribute[];
  /** Unique ID for this form's cookie name. */
  id: string;
  onFilterFormSubmit?: (values: any) => void;
}

/** The cookie should not expire. */
const COOKIE_OPTIONS: CookieSetOptions = { expires: new Date("3000-01-01") };

/** Formik form with the filter builder field. */
export function FilterForm({
  children,
  filterAttributes,
  id,
  onFilterFormSubmit = noop
}: FilterFormProps) {
  const [cookies, setCookie, removeCookie] = useCookies([id]);

  const filterForm = cookies[id] || {};

  function onFilterFormSubmitInternal(values, { setSubmitting }) {
    // On submit, put the filter form's values into a cookie.
    setCookie(id, values, COOKIE_OPTIONS);
    setSubmitting(false);
    onFilterFormSubmit(values);
  }

  function resetFilterForm({ setValues }: FormikProps<any>) {
    removeCookie(id);
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
          {children && children(formikProps)}
          <button className="btn btn-primary" type="submit">
            Filter List
          </button>
          <button
            className="btn btn-dark"
            type="button"
            onClick={() => resetFilterForm(formikProps)}
          >
            Reset
          </button>
        </Form>
      )}
    </Formik>
  );
}
