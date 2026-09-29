import { RevisionsPage } from "../../../components/revisions/RevisionsPageLayout";
import { COLLECTION_MODULE_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-modules";

export default () => (
  <RevisionsPage
    auditSnapshotPath="collection-api/audit-snapshot"
    detailsPageLink="/loan-transaction/transaction/"
    queryPath="collection-api/transaction"
    resourceType="transaction"
    // The row configs are specific to each module (Collection, Object Store, Agent, etc.)
    revisionRowConfigsByType={COLLECTION_MODULE_REVISION_ROW_CONFIG}
  />
);
