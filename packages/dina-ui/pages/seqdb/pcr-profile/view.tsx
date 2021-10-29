import { DinaForm, FieldView } from "common-ui";
import { GroupFieldView, ViewPageLayout } from "../../../components";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { PcrProfile } from "../../../types/seqdb-api/resources/PcrProfile";

export default function PcrProfileDetailsPage() {
  return (
    <ViewPageLayout<PcrProfile>
      form={props => (
        <DinaForm<PcrProfile> {...props}>
          <div>
            <div className="row">
              <GroupFieldView className="col-md-2" name="group" />
            </div>
            <div className="row">
              <FieldView
                className="col-md-2"
                label="Target Gene Region"
                name="region.name"
              />
              <FieldView
                className="col-md-2"
                name="name"
                label="Thermocycler Profile Name"
              />
              <FieldView className="col-md-2" name="application" />
              <FieldView className="col-md-2" name="cycles" />
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="card-group row" style={{ padding: 15 }}>
                  <div className="card card-body col-md-4">
                    <FieldView name="step1" />
                    <FieldView name="step2" />
                    <FieldView name="step3" />
                    <FieldView name="step4" />
                    <FieldView name="step5" />
                  </div>
                  <div className="card card-body col-md-4">
                    <FieldView name="step6" />
                    <FieldView name="step7" />
                    <FieldView name="step8" />
                    <FieldView name="step9" />
                    <FieldView name="step10" />
                  </div>
                  <div className="card card-body col-md-4">
                    <FieldView name="step11" />
                    <FieldView name="step12" />
                    <FieldView name="step13" />
                    <FieldView name="step14" />
                    <FieldView name="step15" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DinaForm>
      )}
      query={id => ({
        path: `seqdb-api/thermocycler-profile/${id}`,
        include: "region"
      })}
      entityLink="/seqdb/pcr-profile"
      type="thermocycler-profile"
      apiBaseUrl="/seqdb-api"
    />
  );
}
