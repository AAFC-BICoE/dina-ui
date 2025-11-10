import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { MolecularAnalysisRun } from "../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { MolecularAnalysisRunFormFields } from "../../../components/molecular-analysis/MolecularAnalysisRunFormFields";

export default function MolecularAnalysisRunViewPage() {
  return (
    <ViewPageLayout<MolecularAnalysisRun>
      form={(props) => (
        <DinaForm<MolecularAnalysisRun> {...props}>
          <MolecularAnalysisRunFormFields />
        </DinaForm>
      )}
      query={(id) => ({
        path: `seqdb-api/molecular-analysis-run/${id}`,
        include: "attachments"
      })}
      entityLink="/seqdb/molecular-analysis-run"
      type="molecular-analysis-run"
      apiBaseUrl="/seqdb-api"
      nameField={(resource) => (resource?.name ? resource.name : "")}
      showRevisionsLink={false}
      showGenerateLabelButton={false}
      showEditButton={false}
      showDeleteButton={false}
    />
  );
}
