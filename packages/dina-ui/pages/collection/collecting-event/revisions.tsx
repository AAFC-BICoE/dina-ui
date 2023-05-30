import { COLLECTION_MODULE_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-modules";
import { RevisionsPage } from "../../../components/revisions/RevisionsPageLayout";

export default () => (
  <RevisionsPage
    auditSnapshotPath="collection-api/audit-snapshot"
    detailsPageLink="/collection/collecting-event/"
    queryPath="collection-api/collecting-event"
    resourceType="collecting-event"
    revisionRowConfigsByType={COLLECTION_MODULE_REVISION_ROW_CONFIG}
    nameField="dwcRecordedBy"
  />
);
