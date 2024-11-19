import { DinaForm, DeleteButton, useApiClient, Operation } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { MolecularAnalysisRun } from "../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { MolecularAnalysisRunFormFields } from "../../../components/molecular-analysis/MolecularAnalysisRunFormFields";
import { MolecularAnalysisRunItem } from "../../../types/seqdb-api/resources/MolecularAnalysisRunItem";

export default function MolecularAnalysisRunViewPage() {
  const { doOperations, apiClient } = useApiClient();
  return (
    <ViewPageLayout<MolecularAnalysisRun>
      form={(props) => (
        <DinaForm<MolecularAnalysisRun> {...props}>
          <MolecularAnalysisRunFormFields />
        </DinaForm>
      )}
      query={(id) => ({
        path: `seqdb-api/molecular-analysis-run/${id}`
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
