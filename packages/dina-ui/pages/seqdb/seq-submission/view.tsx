import { DinaForm } from "common-ui";
import { SeqSubmission } from "../../../../dina-ui/types/seqdb-api/resources/SeqSubmission";
import { ViewPageLayout } from "../../../components";
import { SeqSubmissionFields } from "../../../components/seqdb/seq-submission/SeqSubmissionFields";

export default function SeqSubmissionViewPage() {
  return (
    <ViewPageLayout<SeqSubmission>
      form={(props) => (
        <DinaForm {...props}>
          <SeqSubmissionFields />
        </DinaForm>
      )}
      query={(id) => ({
        path: `seqdb-api/seq-submission/${id}`,
        include: "seqBatch,submittedBy,sequencingFacility"
      })}
      entityLink="/seqdb/seq-submission"
      type="seq-submission"
      apiBaseUrl="/seqdb-api"
    />
  );
}
