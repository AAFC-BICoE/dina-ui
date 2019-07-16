import { Form, Formik, FormikActions } from "formik";
import { FilterParam, KitsuResource } from "kitsu";
import { useState } from "react";
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
  const [filter, setFilter] = useState<FilterParam>();

  function onSubmit(values, { setSubmitting }: FormikActions<any>) {
    setFilter({ rsql: rsql(values.filter) });
    setSubmitting(false);
  }

  return (
    <div>
      <Formik initialValues={{ filter: null }} onSubmit={onSubmit}>
        <Form className="form-group">
          <strong>Filter records:</strong>
          <FilterBuilderField
            filterAttributes={filterAttributes}
            name="filter"
          />
          <button className="btn btn-primary" type="submit">
            Filter List
          </button>
        </Form>
      </Formik>
      <QueryTable<TData> filter={filter} {...queryTableProps} />
    </div>
  );
}
