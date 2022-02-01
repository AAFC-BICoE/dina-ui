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
  "direction",
  "toBeReturned",
  "transactionType",
  "otherIdentifiers",
  "transactionStatus",
  "purposeOfTransaction",
  {
    name: "dateOpen",
    type: "DATE"
  },
  {
    name: "dateClosed",
    type: "DATE"
  },
  {
    name: "dateDue",
    type: "DATE"
  }
];

const TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/loan-transaction/transaction/view?id=${id}`}>{name}</Link>
    ),
    accessor: "transactionNumber"
  },
  "direction",
  "toBeReturned",
  "transactionType",
  stringArrayCell("otherIdentifiers"),
  "transactionStatus",
  "purposeOfTransaction",
  dateCell("dateOpen"),
  dateCell("dateClosed"),
  dateCell("dateDue")
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
            path: "loan-transaction-api/transaction",
            defaultSort: [
              {
                id: "name",
                desc: false
              }
            ]
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
