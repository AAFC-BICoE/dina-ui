import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { PcrPrimer } from "../../../types/seqdb-api/resources/PcrPrimer";
import { PcrPrimerFormFields } from "./edit";

export default function PcrPrimerDetailsPage() {
  return (
    <ViewPageLayout<PcrPrimer>
      form={(props) => (
        <DinaForm<PcrPrimer> {...props}>
          <PcrPrimerFormFields />
        </DinaForm>
      )}
      query={(id) => ({
        include: "region",
        path: `seqdb-api/pcr-primer/${id}`
      })}
      entityLink="/seqdb/pcr-primer"
      type="pcr-primer"
      apiBaseUrl="/seqdb-api"
    />
  );
}
