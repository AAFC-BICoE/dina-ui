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
  "transactionNumber",
  "transactionType",
  "purpose",
  "status",
  // Throws an error on back-end: "BAD_REQUEST: Cannot parse argument type class java.time.LocalDate"
  // {
  //   name: "openedDate",
  //   type: "DATE"
  // },
  // {
  //   name: "closedDate",
  //   type: "DATE"
  // },
  // {
  //   name: "dueDate",
  //   type: "DATE"
  // },
  "remarks"
];

const TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, transactionNumber } }) => (
      <Link href={`/loan-transaction/transaction/view?id=${id}`}>
        <a>{transactionNumber || id}</a>
      </Link>
    ),
    accessor: "transactionNumber"
  },
  "transactionType",
  "materialDirection",
  stringArrayCell("otherIdentifiers"),
  "materialToBeReturned",
  "purpose",
  "status",
  dateCell("openedDate"),
  dateCell("closedDate"),
  dateCell("dueDate")
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
