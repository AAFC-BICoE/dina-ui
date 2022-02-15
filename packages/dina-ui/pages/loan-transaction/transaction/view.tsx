import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { Transaction } from "../../../types/loan-transaction-api";
import { TransactionFormLayout } from "./edit";

export default function TransactionDetailsPage() {
  return (
    <ViewPageLayout<Transaction>
      form={props => (
        <DinaForm {...props}>
          <TransactionFormLayout />
        </DinaForm>
      )}
      query={id => ({ path: `loan-transaction-api/transaction/${id}` })}
      entityLink="/loan-transaction/transaction"
      type="transaction"
      apiBaseUrl="/loan-transaction-api"
      nameField="transactionNumber"
      showRevisionsLink={true}
    />
  );
}
