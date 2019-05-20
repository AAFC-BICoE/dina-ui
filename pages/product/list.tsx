// import Link from "next/link";
import React from "react";
import { ColumnDefinition, Head, Nav, QueryTable } from "../../components";
import { Link, Trans, withNamespaces } from "../../i18n";
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

class ProductListPage extends React.Component {
  public static async getInitialProps() {
    return {
      namespacesRequired: ["product"]
    };
  }
  public render() {
    return (
      <div>
        <Head title="Product Inventory" />
        <Nav />
        <div className="container-fluid">
          <h1>
            <Trans i18nKey="Product Inventory" />
          </h1>
          <Link href="/product/edit" prefetch={true}>
            <a>
              <Trans i18nKey="Add New Product" />
            </a>
          </Link>
          <QueryTable<Product>
            columns={PRODUCT_TABLE_COLUMNS}
            include="group"
            path="product"
          />
        </div>
      </div>
    );
  }
}

export default withNamespaces("product")(ProductListPage);
