import { RevisionsPage } from "../../../components/revisions/RevisionsPageLayout";
import { COLLECTION_MODULE_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-modules";

export default () => (
  <RevisionsPage
    auditSnapshotPath="collection-api/audit-snapshot"
    detailsPageLink="/collection/dataset/"
    queryPath="collection-api/dataset"
    resourceType="dataset"
    revisionRowConfigsByType={COLLECTION_MODULE_REVISION_ROW_CONFIG}
  />
);
