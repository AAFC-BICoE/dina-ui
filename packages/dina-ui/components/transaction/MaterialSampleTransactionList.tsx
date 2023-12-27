import { useCollapsibleSection, LoadingSpinner, QueryPage } from "common-ui";
import { TRANSACTION_TABLE_COLUMNS } from "../../pages/loan-transaction/transaction/list";

export interface TransactionTable {
  // Elastic search query to be performed.
  transactionQueryDSL: any;
}

export function MaterialSampleTransactionList({ transactionQueryDSL }) {
  const [isAccordionOpen] = useCollapsibleSection();

  if (!isAccordionOpen) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <QueryPage
      indexName="dina_loan_transaction_index"
      uniqueName="loan-transaction-material-samples"
      customViewElasticSearchQuery={transactionQueryDSL}
      customViewFields={[]}
      viewMode={true}
      columns={TRANSACTION_TABLE_COLUMNS}
      reactTableProps={{
        showPagination: false,
        enableSorting: true,
        enableMultiSort: true
      }}
      defaultPageSize={500}
      defaultSort={[{ id: "data.attributes.openedDate", desc: false }]}
    />
  );
}
