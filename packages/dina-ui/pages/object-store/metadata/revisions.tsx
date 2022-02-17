import { OBJECT_STORE_MODULE_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-modules";
import { RevisionsPage } from "../../../components/revisions/RevisionsPageLayout";

export default () => (
  <RevisionsPage
    auditSnapshotPath="objectstore-api/audit-snapshot"
    detailsPageLink={`/object-store/object`}
    queryPath="objectstore-api/metadata"
    resourceType="metadata"
    revisionRowConfigsByType={OBJECT_STORE_MODULE_REVISION_ROW_CONFIG}
    nameField="originalFilename"
  />
);
