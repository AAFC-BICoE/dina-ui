import { Form, Formik, FormikActions } from "formik";
import { FilterParam, KitsuResource } from "kitsu";
import { useCookies } from "react-cookie";
import { FilterBuilderField, QueryTable, QueryTableProps } from "..";
import { rsql } from "../filter-builder/rsql";

interface ListPageLayoutProps<TData extends KitsuResource> {
  filterAttributes: string[];
  queryTableProps: QueryTableProps<TData>;
}

export function ListPageLayout<TData extends KitsuResource>({
  filterAttributes,
  queryTableProps
}: ListPageLayoutProps<TData>) {
  // Use a cookie hook to get the cookie, and re-render when the watched cookie is changed.
  const [{ filterForm = {} }, setCookie, removeCookie] = useCookies([
    "filterForm"
  ]);

  const filterParam: FilterParam = {
    rsql: rsql(filterForm.filterBuilderModel)
  };

  function onFilterFormSubmit(values, { setSubmitting }: FormikActions<any>) {
    // On submit, put the filter form's values into a cookie.
    setCookie("filterForm", values);
    setSubmitting(false);
  }

  return (
    <div>
      <Formik initialValues={filterForm} onSubmit={onFilterFormSubmit}>
        <Form className="form-group">
          <strong>Search:</strong>
          <FilterBuilderField
            filterAttributes={filterAttributes}
            name="filterBuilderModel"
          />
          <button className="btn btn-primary" type="submit">
            Filter List
          </button>
        </Form>
      </Formik>
      <QueryTable<TData> filter={filterParam} {...queryTableProps} />
    </div>
  );
}
