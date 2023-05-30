import { COLLECTION_MODULE_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-modules";
import { RevisionsPage8 } from "../../../components/revisions/RevisionsPageLayout8";

export default () => (
  <RevisionsPage8
    auditSnapshotPath="collection-api/audit-snapshot"
    detailsPageLink="/collection/storage-unit/"
    queryPath="collection-api/storage-unit"
    resourceType="storage-unit"
    // The row configs are specific to each module (Collection, Object Store, Agent, etc.)
    revisionRowConfigsByType={COLLECTION_MODULE_REVISION_ROW_CONFIG}
  />
);
