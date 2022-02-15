import {
  ButtonBar,
  CreateButton,
  dateCell,
  FilterAttribute,
  ListPageLayout,
  stringArrayCell
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const FILTER_ATTRIBUTES: FilterAttribute[] = [
  "materialDirection",
  "transactionNumber",
  "materialToBeReturned",
  "purpose",
  "transactionType",
  "status",
  {
    name: "openedDate",
    type: "DATE"
  },
  {
    name: "closedDate",
    type: "DATE"
  },
  {
    name: "dueDate",
    type: "DATE"
  },
  "remarks"
];

const TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, transactionNumber } }) => (
      <Link href={`/loan-transaction/transaction/view?id=${id}`}>
        {transactionNumber}
      </Link>
    ),
    accessor: "transactionNumber"
  },
  "materialDirection",
  stringArrayCell("otherIdentifiers"),
  "materialToBeReturned",
  "purpose",
  "status",
  dateCell("dateOpened"),
  dateCell("dateClosed"),
  dateCell("dateDue"),
  "createdBy",
  dateCell("createdOn")
];

export default function TransactionListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("transactions")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="transactions" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/loan-transaction/transaction" />
        </ButtonBar>
        <ListPageLayout
          filterAttributes={FILTER_ATTRIBUTES}
          id="transaction-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "loan-transaction-api/transaction"
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
