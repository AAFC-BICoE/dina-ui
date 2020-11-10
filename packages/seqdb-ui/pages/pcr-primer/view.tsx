import { FieldView, LoadingSpinner, Query } from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import {
  BackToListButton,
  ButtonBar,
  EditButton,
  Head,
  Nav
} from "../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../intl/seqdb-intl";
import { PcrPrimer } from "../../types/seqdb-api/resources/PcrPrimer";

export function PcrPrimerDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("pcrPrimerViewTitle")} />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="pcr-primer" />
        <BackToListButton entityLink="pcr-primer" />
      </ButtonBar>

      <Query<PcrPrimer>
        query={{ include: "region", path: `seqdb-api/pcrPrimer/${id}` }}
      >
        {({ loading, response }) => (
          <div className="container-fluid">
            <h1>
              <SeqdbMessage id="pcrPrimerViewTitle" />
            </h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <Formik<PcrPrimer> initialValues={response.data} onSubmit={noop}>
                <div>
                  <div className="row">
                    <FieldView className="col-md-2" name="group" />
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
                    <FieldView className="col-md-2" name="dateOrdered" />
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
              </Formik>
            )}
          </div>
        )}
      </Query>
    </div>
  );
}

export default withRouter(PcrPrimerDetailsPage);
