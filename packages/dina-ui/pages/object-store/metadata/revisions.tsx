import { OBJECT_STORE_MODULE_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-modules";
import { RevisionsPage8 } from "../../../components/revisions/RevisionsPageLayout8";

export default () => (
  <RevisionsPage8
    auditSnapshotPath="objectstore-api/audit-snapshot"
    detailsPageLink={`/object-store/object`}
    queryPath="objectstore-api/metadata"
    resourceType="metadata"
    revisionRowConfigsByType={OBJECT_STORE_MODULE_REVISION_ROW_CONFIG}
    nameField="originalFilename"
  />
);
