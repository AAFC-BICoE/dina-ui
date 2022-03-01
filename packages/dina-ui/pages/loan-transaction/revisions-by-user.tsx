import RevisionsByUserPage from "../../components/revision-by-user/CommonRevisionsByUserPage";
import { LOAN_TRANSACTION_MODULE_REVISION_ROW_CONFIG } from "../../components/revisions/revision-modules";

export default function LoanTransactionRevisionByUserPage() {
  return (
    <RevisionsByUserPage
      snapshotPath="loan-transaction-api/audit-snapshot"
      revisionRowConfigsByType={LOAN_TRANSACTION_MODULE_REVISION_ROW_CONFIG}
    />
  );
}
