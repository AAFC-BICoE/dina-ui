import { FormikActions, Formik, Form } from "formik";
import { FilterParam } from "kitsu";
import Link from "next/link";
import { useState } from "react";
import { ColumnDefinition, Head, Nav, QueryTable, FilterBuilderField } from "../../components";
import { rsql } from "../../components/filter-builder/rsql";
import { Protocol } from "../../types/seqdb-api/resources/Protocol";

const PROTOCOL_TABLE_COLUMNS: Array<ColumnDefinition<Protocol>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/protocol/view?id=${id}`}>
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
  {
    Header: "Type",
    accessor: "type"
  },
  {
    Header: "Version",
    accessor: "version"
  },
  {
    Header: "Description",
    accessor: "description"
  },
  {
    Header: "Equipment",
    accessor: "equipment"
  },
  {
    Header: "Kit Group Name",
    accessor: "kit.group.groupname"
  },
  {
    Header: "Kit Name",
    accessor: "kit.name"
  }
];

const PROTOCOL_FILTER_ATTRIBUTES = [
  "name",
  "group.groupName",
  "type",
  "version",
  "description",
  "equipment",
  "kit.group.groupName",
  "kit.name"
];

export default function ProtocolListPage() {
  const [filter, setFilter] = useState<FilterParam>();

  function onSubmit(values, { setSubmitting }: FormikActions<any>) {
    setFilter({ rsql: rsql(values.filter) });
    setSubmitting(false);
  };

  return (
    <div>
      <Head title="Protocols" />
      <Nav />
      <div className="container-fluid">
        <h1>Protocols</h1>
        <Link href="/protocol/edit" prefetch={true}>
          <a>Add Protocol</a>
        </Link>
        <Formik initialValues={{ filter: null }} onSubmit={onSubmit}>
          <Form>
            <h2>Search:</h2>
            <FilterBuilderField
              filterAttributes={PROTOCOL_FILTER_ATTRIBUTES}
              name="filter"
            />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </Form>
        </Formik>
        <QueryTable<Protocol>
          columns={PROTOCOL_TABLE_COLUMNS}
          filter={filter}
          include="group,kit"
          path="protocol"
        />
      </div>
    </div>
  );
}
