import { LOAN_TRANSACTION_MODULE_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-modules";
import { RevisionsPage } from "../../../components/revisions/RevisionsPageLayout";

export default () => (
  <RevisionsPage
    auditSnapshotPath="loan-transaction-api/audit-snapshot"
    detailsPageLink="/loan-transaction/transaction/"
    queryPath="loan-transaction-api/transaction"
    resourceType="transaction"
    // The row configs are specific to each module (Collection, Object Store, Agent, etc.)
    revisionRowConfigsByType={LOAN_TRANSACTION_MODULE_REVISION_ROW_CONFIG}
  />
);
