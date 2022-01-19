import { COLLECTION_REVISION_ROW_CONFIG } from "../../../components/revisions/revision-modules";
import { RevisionsPage } from "../../../components/revisions/RevisionsPageLayout";

export default () => (
  <RevisionsPage
    auditSnapshotPath="collection-api/audit-snapshot"
    detailsPageLink="/collection/institution/view?id="
    queryPath="collection-api/institution"
    resourceType="institution"
    // The row configs are specific to each module (Collection, Object Store, Agent, etc.)
    revisionRowConfigsByType={COLLECTION_REVISION_ROW_CONFIG}
  />
);
