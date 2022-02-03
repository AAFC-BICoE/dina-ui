import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { AcquisitionEvent } from "../../../types/collection-api";
import { AcquisitionEventFormLayout, useAcquisitionEvent } from "./edit";

export default function AcquisitionEventDetailsPage() {
  return (
    <ViewPageLayout<AcquisitionEvent>
      form={props => (
        <DinaForm {...props}>
          <AcquisitionEventFormLayout />
        </DinaForm>
      )}
      customQueryHook={id => useAcquisitionEvent(id)}
      entityLink="/collection/acquisition-event"
      type="acquisition-event"
      apiBaseUrl="/collection-api"
    />
  );
}
