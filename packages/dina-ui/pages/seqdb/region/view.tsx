import { DinaForm, FieldView } from "common-ui";
import { GroupFieldView, ViewPageLayout } from "../../../components";
import { Region } from "../../../types/seqdb-api/resources/Region";

export default function RegionDetailsPage() {
  return (
    <ViewPageLayout<Region>
      form={props => (
        <DinaForm {...props}>
          <div className="row">
            <GroupFieldView className="col-md-2" name="group" />
          </div>
          <div className="row">
            <FieldView className="col-md-2" name="name" />
            <FieldView className="col-md-2" name="description" />
            <FieldView className="col-md-2" name="symbol" />
          </div>
        </DinaForm>
      )}
      query={id => ({ path: `seqdb-api/region/${id}` })}
      entityLink="/seqdb/region"
      type="region"
      apiBaseUrl="/seqdb-api"
      mainClass="container-fluid"
    />
  );
}
