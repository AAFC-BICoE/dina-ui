import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { ThermocyclerProfile } from "../../../types/seqdb-api/resources/ThermocyclerProfile";
import { PcrProfileFormFields } from "./edit";

export default function PcrProfileDetailsPage() {
  return (
    <ViewPageLayout<ThermocyclerProfile>
      form={(props) => (
        <DinaForm<ThermocyclerProfile> {...props}>
          <PcrProfileFormFields />
        </DinaForm>
      )}
      query={(id) => ({
        path: `seqdb-api/thermocycler-profile/${id}`,
        include: "region"
      })}
      entityLink="/seqdb/thermocycler-profile"
      type="thermocycler-profile"
      apiBaseUrl="/seqdb-api"
    />
  );
}
