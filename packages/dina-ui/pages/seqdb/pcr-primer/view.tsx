import { DateField, DinaForm, FieldView } from "common-ui";
import { GroupFieldView, ViewPageLayout } from "../../../components";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { PcrPrimer } from "../../../types/seqdb-api/resources/PcrPrimer";

export default function PcrPrimerDetailsPage() {
  return (
    <ViewPageLayout<PcrPrimer>
      form={props => (
        <DinaForm<PcrPrimer> {...props}>
          <div>
            <div className="row">
              <GroupFieldView className="col-md-2" name="group" />
            </div>
            <div className="row">
              <FieldView className="col-md-2" name="type" />
            </div>
            <div className="row">
              <FieldView
                className="col-md-2"
                label="Target Gene Region"
                name="region.name"
              />
              <FieldView className="col-md-2" name="name" />
              <FieldView className="col-md-2" name="lotNumber" />
              <FieldView className="col-md-2" name="targetSpecies" />
              <FieldView className="col-md-2" name="purification" />
            </div>
            <div className="row">
              <FieldView className="col-md-2" name="direction" />
              <FieldView className="col-md-2" name="tmCalculated" />
              <DateField
                className="col-md-2"
                disabled={true}
                name="dateOrdered"
              />
            </div>
            <div className="row">
              <FieldView
                className="col-md-6"
                label="Primer Sequence (5' - 3')"
                name="seq"
              />
            </div>
            <div className="row">
              <FieldView className="col-md-2" name="application" />
              <FieldView className="col-md-2" name="reference" />
              <FieldView className="col-md-2" name="supplier" />
              <FieldView className="col-md-2" name="designedBy" />
              <FieldView
                className="col-md-2"
                label="Stock Concentration(uM)"
                name="stockConcentration"
              />
            </div>
            <div className="row">
              <FieldView className="col-md-6" name="note" />
            </div>
          </div>
        </DinaForm>
      )}
      query={id => ({ include: "region", path: `seqdb-api/pcr-primer/${id}` })}
      entityLink="/seqdb/pcr-primer"
      type="pcr-primer"
      apiBaseUrl="/seqdb-api"
    />
  );
}
