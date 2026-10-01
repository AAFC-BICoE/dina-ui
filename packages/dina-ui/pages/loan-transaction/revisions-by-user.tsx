import RevisionsByUserPage from "../../components/revision-by-user/CommonRevisionsByUserPage";
import { COLLECTION_MODULE_REVISION_ROW_CONFIG } from "../../components/revisions/revision-modules";

export default function LoanTransactionRevisionByUserPage() {
  return (
    <RevisionsByUserPage
      snapshotPath="collection-api/audit-snapshot"
      revisionRowConfigsByType={COLLECTION_MODULE_REVISION_ROW_CONFIG}
    />
  );
}
