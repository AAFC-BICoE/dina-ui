import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { Transaction } from "../../../types/loan-transaction-api";
import { TransactionFormLayout, useTransactionQuery } from "./edit";

export default function TransactionDetailsPage() {
  return (
    <ViewPageLayout<Transaction>
      form={(props) => (
        <DinaForm {...props}>
          <TransactionFormLayout />
        </DinaForm>
      )}
      customQueryHook={(id) => useTransactionQuery(id, true)}
      entityLink="/loan-transaction/transaction"
      type="transaction"
      apiBaseUrl="/loan-transaction-api"
      nameField="transactionNumber"
      showRevisionsLink={true}
    />
  );
}
