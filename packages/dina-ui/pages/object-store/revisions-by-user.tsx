import { OBJECT_STORE_MODULE_REVISION_ROW_CONFIG } from "../../components/revisions/revision-modules";
import RevisionsByUserPage from "../../components/revision-by-user/CommonRevisionsByUserPage";

export default function ObjectStoreRevisionByUserPage() {
  return (
    <RevisionsByUserPage
      snapshotPath="objectstore-api/audit-snapshot"
      revisionRowConfigsByType={OBJECT_STORE_MODULE_REVISION_ROW_CONFIG}
    />
  );
}
