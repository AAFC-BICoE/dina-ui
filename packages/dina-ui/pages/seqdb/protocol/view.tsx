import { DinaForm, FieldView } from "common-ui";
import { GroupFieldView, ViewPageLayout } from "../../../components";
import { Protocol } from "../../../types/seqdb-api/resources/Protocol";

export default function ProtocolDetailsPage() {
  return (
    <ViewPageLayout<Protocol>
      form={props => (
        <DinaForm<Protocol> {...props}>
          <div>
            <div className="row">
              <GroupFieldView className="col-md-2" name="group" />
            </div>
            <div className="row">
              <FieldView className="col-md-2" name="type" />
              <FieldView className="col-md-2" name="name" />
              <FieldView className="col-md-2" name="version" />
              <FieldView className="col-md-2" name="description" />
            </div>
            <div className="row">
              <FieldView className="col-md-8" name="steps" />
            </div>
            <div className="row">
              <FieldView className="col-md-8" name="notes" />
            </div>
            <div className="row">
              <FieldView className="col-md-2" name="reference" />
              <FieldView className="col-md-2" name="equipment" />
              <FieldView className="col-md-2" name="kit.name" />
            </div>
            <div className="row">
              <FieldView className="col-md-2" name="lastModified" />
            </div>
          </div>
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
