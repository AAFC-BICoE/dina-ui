import { CollapsibleSection, QueryPage } from "common-ui";
import { TRANSACTION_TABLE_COLUMNS } from "../../pages/loan-transaction/transaction/list";

export interface TransactionTable {
  // Elastic search query to be performed.
  transactionQueryDSL: any;
}

export function MaterialSampleTransactionList({ transactionQueryDSL }) {
  return (
    <CollapsibleSection id="transactions" headerKey="transactions">
      <QueryPage
        indexName="dina_loan_transaction_index"
        customViewElasticSearchQuery={transactionQueryDSL}
        customViewFields={[]}
        viewMode={true}
        columns={TRANSACTION_TABLE_COLUMNS}
        reactTableProps={{
          showPagination: false
        }}
        defaultPageSize={500}
        defaultSort={[{ id: "data.attributes.openedDate", desc: false }]}
      />
    </CollapsibleSection>
  );
}
