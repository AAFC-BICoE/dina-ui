import { DinaForm } from "common-ui";
import {
  ProtocolFormLayout,
  ProtocolFormValue
} from "../../../../dina-ui/components/collection/protocol/ProtocolForm";
import { useProtocolFormConverter } from "../../../../dina-ui/components/collection/protocol/useProtocolFormConverter";
import { ViewPageLayout } from "../../../components";
import { Protocol } from "../../../types/collection-api/resources/Protocol";

export default function PreparationTypeDetailsPage() {
  const { convertProtocolToFormData } = useProtocolFormConverter();
  return (
    <ViewPageLayout<Protocol>
      form={(props) => {
        const fetchedProtocol = props.initialValues;
        const initialValues: ProtocolFormValue =
          convertProtocolToFormData(fetchedProtocol);
        return (
          <DinaForm<ProtocolFormValue> {...props} initialValues={initialValues}>
            <ProtocolFormLayout />
          </DinaForm>
        );
      }}
      query={(id) => ({ path: `collection-api/protocol/${id}` })}
      entityLink="/collection/protocol"
      type="protocol"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
