import { COLLECTION_MODULE_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-modules";
import { RevisionsPage8 } from "../../../components/revisions/RevisionsPageLayout8";

export default () => (
  <RevisionsPage8
    auditSnapshotPath="collection-api/audit-snapshot"
    detailsPageLink="/collection/collecting-event/"
    queryPath="collection-api/collecting-event"
    resourceType="collecting-event"
    revisionRowConfigsByType={COLLECTION_MODULE_REVISION_ROW_CONFIG}
    nameField="dwcRecordedBy"
  />
);
