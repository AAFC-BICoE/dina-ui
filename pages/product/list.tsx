import Link from "next/link";
import { ColumnDefinition, Head, ButtonBar } from "../../components";
import { Product } from "../../types/seqdb-api/resources/Product";
import { Nav } from "../../components/nav/nav";
import { ListPageLayout } from "../../components/list-page-layout/ListPageLayout";

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
    <div>
      <Head title="Product Inventory" />
      <Nav />
      <ButtonBar>
        <Link href="/product/edit" prefetch={true}>
          <button className="btn btn-primary">Create Product</button>
        </Link>
      </ButtonBar>
      <ListPageLayout
        filterAttributes={PRODUCT_FILTER_ATTRIBUTES}
        queryTableProps={{
          columns: PRODUCT_TABLE_COLUMNS,
          include: "group",
          path: "product"
        }}
      />      
    </div>
  );
}
