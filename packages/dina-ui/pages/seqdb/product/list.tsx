import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout,
  dateCell
} from "common-ui";
import Link from "next/link";
import { Footer, groupCell, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Product } from "../../../types/seqdb-api/resources/Product";

const PRODUCT_TABLE_COLUMNS: ColumnDefinition<Product>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => <Link href={`/seqdb/product/view?id=${id}`}>{name}</Link>,
    accessorKey: "name"
  },
  {
    header: "UPC",
    accessorKey: "upc"
  },
  "type",
  "description",
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

const PRODUCT_FILTER_ATTRIBUTES = ["name", "upc", "type", "description"];

export default function ProductListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("productListTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/seqdb/product" />
        </div>
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
      <Footer />
    </>
  );
}
