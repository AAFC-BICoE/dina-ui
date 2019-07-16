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
import { Region } from "../../types/seqdb-api/resources/Region";

const REGION_TABLE_COLUMNS: Array<ColumnDefinition<Region>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/region/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  "description",
  "symbol"
];

const REGION_FILTER_ATTRIBUTES = ["name", "description", "symbol"];

export default function RegionListPage() {
  const [filter, setFilter] = useState<FilterParam>();

  function onSubmit(values, { setSubmitting }: FormikActions<any>) {
    setFilter({ rsql: rsql(values.filter) });
    setSubmitting(false);
  }

  return (
    <div>
      <Head title="Gene Regions" />
      <Nav />
      <div className="container-fluid">
        <h1>Gene Regions</h1>
        <Link href="/region/edit" prefetch={true}>
          <a>Add Gene Region</a>
        </Link>
        <Formik initialValues={{ filter: null }} onSubmit={onSubmit}>
          <Form>
            <strong>Filter Records:</strong>
            <FilterBuilderField
              filterAttributes={REGION_FILTER_ATTRIBUTES}
              name="filter"
            />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </Form>
        </Formik>
        <QueryTable<Region>
          columns={REGION_TABLE_COLUMNS}
          filter={filter}
          path="region"
        />
      </div>
    </div>
  );
}
