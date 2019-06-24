import { Form, Formik, FormikActions } from "formik";
import { FilterParam } from "kitsu";
import Link from "next/link";
import { useState } from "react";
import {
  ColumnDefinition,
  FilterBuilderField,
  Head,
  Nav,
  QueryTable
} from "../../components";
import { rsql } from "../../components/filter-builder/rsql";

const WORKFLOW_TABLE_COLUMNS: Array<ColumnDefinition<any>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/workflow/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  "type",
  "group.groupName"
];

const WORKFLOW_FILTER_ATTRIBUTES = ["name", "type", "group.groupName"];

export default function WorkflowListPage() {
  const [filter, setFilter] = useState<FilterParam>();

  function onSubmit(values, { setSubmitting }: FormikActions<any>) {
    setFilter({ rsql: rsql(values.filter) });
    setSubmitting(false);
  }

  return (
    <div>
      <Head title="Workflows" />
      <Nav />
      <div className="container-fluid">
        <h1>Workflows</h1>
        <Link href="/workflow/edit" prefetch={true}>
          <a>Add New Workflow</a>
        </Link>
        <Formik initialValues={{ filter: null }} onSubmit={onSubmit}>
          <Form>
            <strong>Search:</strong>
            <FilterBuilderField
              filterAttributes={WORKFLOW_FILTER_ATTRIBUTES}
              name="filter"
            />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </Form>
        </Formik>
        <QueryTable
          columns={WORKFLOW_TABLE_COLUMNS}
          filter={filter}
          include="group,region"
          path="pcrPrimer"
        />
      </div>
    </div>
  );
}
