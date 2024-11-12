import { DinaForm, DeleteButton } from "common-ui";
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
        path: `seqdb-api/molecular-analysis-run-item?include=run,result&filter[rsql]=run.uuid==${id}`
      })}
      entityLink="/seqdb-api/molecular-analysis-run"
      type="molecular-analysis-run"
      apiBaseUrl="/seqdb-api"
      deleteButton={(formProps) => (
        <DeleteButton
          id={formProps.initialValues.id}
          options={{ apiBaseUrl: "/seqdb-api" }}
          postDeleteRedirect="/seqdb-api/molecular-analysis-run/list"
          type="molecular-analysis-run"
        />
      )}
      showGenerateLabelButton={true}
      nameField={(resource) => (resource?.name ? resource.name : "")}
      showRevisionsLink={true}
    />
  );
}
