import Link from "next/link";
import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  Head,
  ListPageLayout,
  Nav
} from "../../components";
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
  return (
    <>
      <Head title="Product Inventory" />
      <Nav />
      <ButtonBar>
        <CreateButton entityLabel="Product" entityLink="product" />
      </ButtonBar>
      <div className="container-fluid">
        <h1>Product Inventory</h1>
        <ListPageLayout
          filterAttributes={PRODUCT_FILTER_ATTRIBUTES}
          queryTableProps={{
            columns: PRODUCT_TABLE_COLUMNS,
            include: "group",
            path: "product"
          }}
        />
      </div>
    </>
  );
}
