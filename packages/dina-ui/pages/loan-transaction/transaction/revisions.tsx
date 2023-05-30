import { RevisionsPage8 } from "packages/dina-ui/components/revisions/RevisionsPageLayout8";
import { LOAN_TRANSACTION_MODULE_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-modules";

export default () => (
  <RevisionsPage8
    auditSnapshotPath="loan-transaction-api/audit-snapshot"
    detailsPageLink="/loan-transaction/transaction/"
    queryPath="loan-transaction-api/transaction"
    resourceType="transaction"
    // The row configs are specific to each module (Collection, Object Store, Agent, etc.)
    revisionRowConfigsByType={LOAN_TRANSACTION_MODULE_REVISION_ROW_CONFIG}
  />
);
