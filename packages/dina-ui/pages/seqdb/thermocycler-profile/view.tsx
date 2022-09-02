import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { ThermocyclerProfile } from "../../../types/seqdb-api/resources/ThermocyclerProfile";
import { ThermocyclerProfileFormFields } from "../../../components/thermocycler-profile/ThermocyclerProfileFormFields";

export default function ThermocyclerProfileDetailsPage() {
  return (
    <ViewPageLayout<ThermocyclerProfile>
      form={(props) => (
        <DinaForm<ThermocyclerProfile> {...props}>
          <ThermocyclerProfileFormFields readOnly={true} />
        </DinaForm>
      )}
      query={(id) => ({
        path: `seqdb-api/thermocycler-profile/${id}`,
        include: "region"
      })}
      entityLink="/seqdb/thermocycler-profile"
      type="thermocycler-profile"
      apiBaseUrl="/seqdb-api"
      alterInitialValues={(resource) => ({
        ...resource,
        ...(resource?.steps
          ? { steps: resource.steps.map((value) => ({ step: value })) }
          : { steps: [""] })
      })}
    />
  );
}
