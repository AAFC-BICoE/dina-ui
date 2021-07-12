import {
  BackToListButton,
  ButtonBar,
  DateField,
  DinaForm,
  EditButton,
  FieldView,
  LoadingSpinner,
  Query
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { GroupFieldView, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrPrimer } from "../../../types/seqdb-api/resources/PcrPrimer";

export function PcrPrimerDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("pcrPrimerViewTitle")} />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="seqdb/pcr-primer" />
        <BackToListButton entityLink="/seqdb/pcr-primer" />
      </ButtonBar>

      <Query<PcrPrimer>
        query={{ include: "region", path: `seqdb-api/pcr-primer/${id}` }}
      >
        {({ loading, response }) => (
          <main className="container-fluid">
            <h1>
              <SeqdbMessage id="pcrPrimerViewTitle" />
            </h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <DinaForm<PcrPrimer> initialValues={response.data}>
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
          </main>
        )}
      </Query>
    </div>
  );
}

export default withRouter(PcrPrimerDetailsPage);
