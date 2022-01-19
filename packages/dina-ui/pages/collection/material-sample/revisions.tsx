import { COLLECTION_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-modules";
import { RevisionsPage } from "../../../components/revisions/RevisionsPageLayout";

export default () => (
  <RevisionsPage
    auditSnapshotPath="collection-api/audit-snapshot"
    detailsPageLink="/collection/material-sample/view?id="
    queryPath="collection-api/material-sample"
    resourceType="material-sample"
    revisionRowConfigsByType={COLLECTION_REVISION_ROW_CONFIG}
    nameField="materialSampleName"
  />
);
