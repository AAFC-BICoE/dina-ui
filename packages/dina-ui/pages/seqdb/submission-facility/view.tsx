import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { SubmissionFacility } from "../../../types/seqdb-api/resources/SubmissionFacility";
import { SubmissionFacilityFormFields } from "./edit";

export default function SubmissionFacilityDetailsPage() {
  return (
    <ViewPageLayout<SubmissionFacility>
      form={(props) => (
        <DinaForm {...props}>
          <SubmissionFacilityFormFields />
        </DinaForm>
      )}
      query={(id) => ({ path: `seqdb-api/sequencing-facility/${id}` })}
      entityLink="/seqdb/submission-facility"
      type="sequencing-facility"
      apiBaseUrl="/seqdb-api"
    />
  );
}
