import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { PcrProfile } from "../../../types/seqdb-api/resources/PcrProfile";
import { PcrProfileFormFields } from "./edit";

export default function PcrProfileDetailsPage() {
  return (
    <ViewPageLayout<PcrProfile>
      form={props => (
        <DinaForm<PcrProfile> {...props}>
          <PcrProfileFormFields />
        </DinaForm>
      )}
      query={id => ({
        path: `seqdb-api/thermocycler-profile/${id}`,
        include: "region"
      })}
      entityLink="/seqdb/thermocycler-profile"
      type="thermocycler-profile"
      apiBaseUrl="/seqdb-api"
    />
  );
}
