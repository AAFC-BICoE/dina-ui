import {
  ButtonBar,
  ColumnDefinition8,
  CreateButton,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { groupCell8, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Product } from "../../../types/seqdb-api/resources/Product";

const PRODUCT_TABLE_COLUMNS: ColumnDefinition8<Product>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/seqdb/product/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    accessorKey: "name"
  },
  groupCell8("group"),
  {
    header: "UPC",
    accessorKey: "upc"
  },
  "type",
  "description"
];

const PRODUCT_FILTER_ATTRIBUTES = ["name", "upc", "type", "description"];

export default function ProductListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("productListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="/seqdb/product" />
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="productListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={PRODUCT_FILTER_ATTRIBUTES}
          id="product-list"
          queryTableProps={{
            columns: PRODUCT_TABLE_COLUMNS,
            path: "seqdb-api/product"
          }}
        />
      </main>
    </>
  );
}
