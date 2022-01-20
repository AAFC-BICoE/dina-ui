import { COLLECTION_MODULE_REVISION_ROW_CONFIG } from "../../components/revisions/revision-modules";
import RevisionsByUserPage from "../../components/revision-by-user/CommonRevisionsByUserPage";

export default function CollectionRevisionByUserPage() {
  return (
    <RevisionsByUserPage
      snapshotPath="collection-api/audit-snapshot"
      revisionRowConfigsByType={COLLECTION_MODULE_REVISION_ROW_CONFIG}
    />
  );
}
