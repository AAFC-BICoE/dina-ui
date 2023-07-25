import { DinaForm, FieldView, QueryTable8 } from "common-ui";
import { GroupFieldView, ViewPageLayout } from "../../../components";
import { IndexSet } from "../../../types/seqdb-api";

export default function IndexSetViewPage() {
  return (
    <ViewPageLayout<IndexSet>
      form={(props) => (
        <DinaForm {...props}>
          <div className="row">
            <FieldView className="col-md-2" name="name" />
            <GroupFieldView className="col-md-2" name="group" />
          </div>
          <div className="row">
            <FieldView className="col-md-6" name="forwardAdapter" />
            <FieldView className="col-md-6" name="reverseAdapter" />
          </div>
          <strong>NGS indexes:</strong>
          <QueryTable8
            columns={["name", "lotNumber", "direction"]}
            path={`seqdb-api/index-set/${props.initialValues.id}/ngsIndexes`}
          />
        </DinaForm>
      )}
      query={(id) => ({ path: `seqdb-api/index-set/${id}` })}
      entityLink="/seqdb/index-set"
      type="index-set"
      apiBaseUrl="/seqdb-api"
      mainClass="container-fluid"
      editButton={() => null}
    />
  );
}
