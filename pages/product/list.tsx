import { Form, Formik, FormikActions } from "formik";
import { FilterParam } from "kitsu";
import Link from "next/link";
import { useState } from "react";
import {
  ButtonBar,
  ColumnDefinition,
  FilterBuilderField,
  Head,
  Nav,
  QueryTable
} from "../../components";
import { rsql } from "../../components/filter-builder/rsql";
import { Product } from "../../types/seqdb-api/resources/Product";

const PRODUCT_TABLE_COLUMNS: Array<ColumnDefinition<Product>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/product/view?id=${id}`}>
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
    Header: "UPC",
    accessor: "upc"
  },
  "type",
  "description"
];

const PRODUCT_FILTER_ATTRIBUTES = [
  "name",
  "group.groupName",
  "upc",
  "type",
  "description"
];

export default function ProductListPage() {
  const [filter, setFilter] = useState<FilterParam>();

  function onSubmit(values, { setSubmitting }: FormikActions<any>) {
    setFilter({ rsql: rsql(values.filter) });
    setSubmitting(false);
  }

  return (
    <div>
      <Head title="Product Inventory" />
      <Nav />
      <ButtonBar>
        <Link href="/product/edit" prefetch={true}>
          <button className="btn btn-primary">Create Product</button>
        </Link>
      </ButtonBar>

      <div className="container-fluid">
        <h1>Product Inventory</h1>
        <Formik initialValues={{ filter: null }} onSubmit={onSubmit}>
          <Form>
            <h2>Search:</h2>
            <FilterBuilderField
              filterAttributes={PRODUCT_FILTER_ATTRIBUTES}
              name="filter"
            />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </Form>
        </Formik>
        <QueryTable<Product>
          columns={PRODUCT_TABLE_COLUMNS}
          filter={filter}
          include="group"
          path="product"
        />
      </div>
    </div>
  );
}
