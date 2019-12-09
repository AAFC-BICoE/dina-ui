import { ColumnDefinition } from "common-ui";
import Link from "next/link";
import {
  ButtonBar,
  CreateButton,
  Head,
  ListPageLayout,
  Nav
} from "../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../intl/seqdb-intl";
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
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("productListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="product" />
      </ButtonBar>
      <div className="container-fluid">
        <h1>
          <SeqdbMessage id="productListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={PRODUCT_FILTER_ATTRIBUTES}
          id="product-list"
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
