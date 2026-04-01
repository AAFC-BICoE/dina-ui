import { RevisionsPage as Layout } from "packages/dina-ui/components/revisions/RevisionsPageLayout";
import { COLLECTION_MODULE_REVISION_ROW_CONFIG } from "packages/dina-ui/components/revisions/revision-modules";

export default function RevisionsPage() {
  return (
    <Layout
      auditSnapshotPath="collection-api/audit-snapshot"
      detailsPageLink="/collection/site/"
      queryPath="collection-api/site"
      resourceType="site"
      revisionRowConfigsByType={COLLECTION_MODULE_REVISION_ROW_CONFIG}
      nameField="dwcRecordedBy"
    />
  );
}
