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
import { PcrPrimer } from "../../types/seqdb-api/resources/PcrPrimer";

const PCRPRIMER_TABLE_COLUMNS: Array<ColumnDefinition<PcrPrimer>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/pcr-primer/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  {
    Header: "Group Name",
    accessor: "group.groupName"
  },
  "region.name",
  "type",
  "lotNumber",
  "application",
  "direction",
  "seq",
  "tmCalculated"
];

const PCR_PRIMER_FILTER_ATTRIBUTES = [
  "name",
  "targetSpecies",
  "application",
  "purification",
  "direction",
  "seq",
  "tmCalculated",
  "reference",
  "supplier",
  "region.name",
  "group.groupName"
];

export default function PcrPrimerListPage() {
  const [filter, setFilter] = useState<FilterParam>();

  function onSubmit(values, { setSubmitting }: FormikActions<any>) {
    setFilter({ rsql: rsql(values.filter) });
    setSubmitting(false);
  }

  return (
    <div>
      <Head title="PCR Primers" />
      <Nav />
      <div className="container-fluid">
        <h1>PCR Primers</h1>
        <Link href="/pcr-primer/edit" prefetch={true}>
          <a>Add PCR Primer</a>
        </Link>
        <Formik initialValues={{ filter: null }} onSubmit={onSubmit}>
          <Form>
            <h2>Search:</h2>
            <FilterBuilderField
              filterAttributes={PCR_PRIMER_FILTER_ATTRIBUTES}
              name="filter"
            />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </Form>
        </Formik>
        <QueryTable<PcrPrimer>
          columns={PCRPRIMER_TABLE_COLUMNS}
          filter={filter}
          include="group,region"
          path="pcrPrimer"
        />
      </div>
    </div>
  );
}
