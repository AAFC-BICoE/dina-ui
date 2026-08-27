import { AGENT_MODULE_REVISION_ROW_CONFIG } from "../../components/revisions/revision-modules";
import { RevisionsPage } from "../../components/revisions/RevisionsPageLayout";

export default () => (
  <RevisionsPage
    auditSnapshotPath="agent-api/audit-snapshot"
    detailsPageLink="/organization"
    nameField="names[0].name"
    queryPath="agent-api/organization"
    resourceType="organization"
    // The row configs are specific to each module (Collection, Object Store, Agent, etc.)
    revisionRowConfigsByType={AGENT_MODULE_REVISION_ROW_CONFIG}
  />
);
