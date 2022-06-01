import { DinaForm } from "common-ui";
import { fromPairs } from "lodash";
import { Protocol } from "../../../types/collection-api/resources/Protocol";
import { ViewPageLayout } from "../../../components";
import { ProtocolFormLayout } from "./edit";

export default function PreparationTypeDetailsPage() {
  return (
    <ViewPageLayout<Protocol>
      form={props => (
        <DinaForm<Protocol>
          {...props}
          initialValues={{
            ...props.initialValues,
            // Convert multilingualDescription to editable Dictionary format:
            multilingualDescription: fromPairs<string | undefined>(
              props.initialValues.multilingualDescription?.descriptions?.map(
                ({ desc, lang }) => [lang ?? "", desc ?? ""]
              )
            )
          }}
        >
          <ProtocolFormLayout />
        </DinaForm>
      )}
      query={id => ({ path: `collection-api/protocol/${id}` })}
      entityLink="/collection/protocol"
      type="protocol"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
