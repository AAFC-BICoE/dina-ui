import {
  ButtonBar,
  CreateButton,
  FieldHeader,
  QueryPage,
  booleanCell,
  dateCell,
  stringArrayCell
} from "common-ui";
import { TableColumn } from "common-ui/lib/list-page/types";
import Link from "next/link";
import { Transaction } from "packages/dina-ui/types/loan-transaction-api";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

export const TRANSACTION_TABLE_COLUMNS: TableColumn<Transaction>[] = [
  {
    id: "transactionNumber",
    cell: ({ row: { original } }) => (
      <Link href={`/loan-transaction/transaction/view?id=${original.id}`}>
        {(original as any).data?.attributes?.transactionNumber || original.id}
      </Link>
    ),
    header: () => <FieldHeader name="transactionNumber" />,
    accessorKey: "data.attributes.transactionNumber",
    isKeyword: true
  },
  {
    id: "transactionType",
    header: () => <FieldHeader name="transactionType" />,
    accessorKey: "data.attributes.transactionType",
    isKeyword: true
  },
  {
    id: "materialDirection",
    header: () => <FieldHeader name="materialDirection" />,
    accessorKey: "data.attributes.materialDirection",
    isKeyword: true
  },
  stringArrayCell("otherIdentifiers", "data.attributes.otherIdentifiers"),
  booleanCell("materialToBeReturned", "data.attributes.materialToBeReturned"),
  {
    id: "purpose",
    header: () => <FieldHeader name="purpose" />,
    accessorKey: "data.attributes.purpose",
    isKeyword: true
  },
  {
    id: "status",
    header: () => <FieldHeader name="status" />,
    accessorKey: "data.attributes.status",
    isKeyword: true
  },
  dateCell("openedDate", "data.attributes.openedDate"),
  dateCell("closedDate", "data.attributes.closedDate"),
  dateCell("dueDate", "data.attributes.dueDate"),
  dateCell("createdOn", "data.attributes.createdOn")
];

export default function TransactionListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("transactions")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/loan-transaction/transaction" />
        </div>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="transactions" />
        </h1>
        <QueryPage
          indexName={"dina_loan_transaction_index"}
          uniqueName="transaction-list-material-samples"
          columns={TRANSACTION_TABLE_COLUMNS}
          reactTableProps={{
            enableSorting: true,
            enableMultiSort: true
          }}
          enableRelationshipPresence={false}
          mandatoryDisplayedColumns={["transactionNumber"]}
          nonExportableColumns={[]}
          dynamicFieldMapping={{
            fields: [
              {
                type: "managedAttribute",
                label: "managedAttributes",
                path: "data.attributes.managedAttributes",
                apiEndpoint: "loan-transaction-api/managed-attribute"
              }
            ],
            relationshipFields: []
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
