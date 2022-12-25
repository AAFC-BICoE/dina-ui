import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { SequencingFacility } from "../../../types/seqdb-api/resources/SequencingFacility";
import { SequencingFacilityFormFields } from "./edit";

export default function SequencingFacilityDetailsPage() {
  return (
    <ViewPageLayout<SequencingFacility>
      form={(props) => (
        <DinaForm {...props}>
          <SequencingFacilityFormFields />
        </DinaForm>
      )}
      query={(id) => ({ path: `seqdb-api/sequencing-facility/${id}` })}
      entityLink="/seqdb/sequencing-facility"
      type="sequencing-facility"
      apiBaseUrl="/seqdb-api"
    />
  );
}
