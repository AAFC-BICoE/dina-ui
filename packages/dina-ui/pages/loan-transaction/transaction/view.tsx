import { DinaForm } from "common-ui";
import { ViewPageLayoutWithCustomHook } from "../../../components";
import { Transaction } from "../../../types/loan-transaction-api";
import { TransactionFormLayout, useTransactionQuery } from "./edit";

export default function TransactionDetailsPage() {
  return (
    <ViewPageLayoutWithCustomHook<Transaction>
      form={(props) => (
        <DinaForm {...props}>
          <TransactionFormLayout />
        </DinaForm>
      )}
      customQueryHook={useTransactionQuery}
      customQueryHookOptions={{ showPermissions: true }}
      entityLink="/loan-transaction/transaction"
      type="transaction"
      apiBaseUrl="/loan-transaction-api"
      nameField="transactionNumber"
      showRevisionsLink={true}
    />
  );
}
