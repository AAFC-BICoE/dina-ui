import { Form, Formik, FormikActions, FormikProps } from "formik";
import { FilterParam, KitsuResource } from "kitsu";
import { useCookies } from "react-cookie";
import { CookieSetOptions } from "universal-cookie";
import { FilterBuilderField, QueryTable, QueryTableProps } from "..";
import { rsql } from "../filter-builder/rsql";

interface ListPageLayoutProps<TData extends KitsuResource> {
  filterAttributes: string[];
  queryTableProps: QueryTableProps<TData>;
}

const FILTER_FORM_COOKIE = "filterForm";
const TABLE_PAGE_SIZE_COOKIE = "tablePageSize";
const TABLE_SORT_COOKIE = "tableSort";

/** The cookie should not expire. */
const COOKIE_OPTIONS: CookieSetOptions = { expires: new Date("3000-01-01") };

/**
 * Generic layout component for list pages. Renders a QueryTable with a filter builder.
 * The filter form state is hydrated from a cookie, and is saved in a cookie on form submit.
 */
export function ListPageLayout<TData extends KitsuResource>({
  filterAttributes,
  queryTableProps
}: ListPageLayoutProps<TData>) {
  // Use a cookie hook to get the cookies, and re-render when the watched cookies are changed.
  const [cookies, setCookie, removeCookie] = useCookies([
    FILTER_FORM_COOKIE,
    TABLE_PAGE_SIZE_COOKIE,
    TABLE_SORT_COOKIE
  ]);

  const filterForm = cookies[FILTER_FORM_COOKIE] || {};

  // Default sort and page-size from the QueryTable. These are only used on the initial
  // QueryTable render, and are saved as cookies when the table's sort or page-size is changed.
  const defaultSort = cookies[TABLE_SORT_COOKIE];
  const defaultPageSize = cookies[TABLE_PAGE_SIZE_COOKIE];

  // Build the JSONAPI filter param to be sent to the back-end.
  const filterParam: FilterParam = {
    rsql: rsql(filterForm.filterBuilderModel)
  };

  function onFilterFormSubmit(values, { setSubmitting }: FormikActions<any>) {
    // On submit, put the filter form's values into a cookie.
    setCookie(FILTER_FORM_COOKIE, values, COOKIE_OPTIONS);
    setSubmitting(false);
  }

  function resetFilterForm({ setValues, submitForm }: FormikProps<any>) {
    removeCookie(FILTER_FORM_COOKIE);
    setValues({});
    submitForm();
  }

  return (
    <div>
      <Formik initialValues={filterForm} onSubmit={onFilterFormSubmit}>
        {formikProps => (
          <Form className="form-group">
            <strong>Filter records:</strong>
            <FilterBuilderField
              filterAttributes={filterAttributes}
              name="filterBuilderModel"
            />
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
      <QueryTable<TData>
        defaultPageSize={defaultPageSize}
        defaultSort={defaultSort}
        filter={filterParam}
        onPageSizeChange={newSize =>
          setCookie(TABLE_PAGE_SIZE_COOKIE, newSize, COOKIE_OPTIONS)
        }
        onSortedChange={newSort =>
          setCookie(TABLE_SORT_COOKIE, newSort, COOKIE_OPTIONS)
        }
        {...queryTableProps}
      />
    </div>
  );
}
