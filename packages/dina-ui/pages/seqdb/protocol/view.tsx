import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { Protocol } from "../../../types/seqdb-api/resources/Protocol";
import { ProtocolFormFields } from "./edit";

export default function ProtocolDetailsPage() {
  return (
    <ViewPageLayout<Protocol>
      form={props => (
        <DinaForm<Protocol> {...props}>
          <ProtocolFormFields />
        </DinaForm>
      )}
      query={id => ({ path: `seqdb-api/protocol/${id}` })}
      entityLink="/seqdb/protocol"
      type="protocol"
      apiBaseUrl="/seqdb-api"
      mainClass="container-fluid"
    />
  );
}
