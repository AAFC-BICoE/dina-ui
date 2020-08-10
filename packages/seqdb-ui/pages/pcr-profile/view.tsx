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
import { PcrProfile } from "../../types/seqdb-api/resources/PcrProfile";

export function PcrProfileDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("pcrProfileViewTitle")} />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="pcr-profile" />
        <BackToListButton entityLink="pcr-profile" />
      </ButtonBar>
      <Query<PcrProfile>
        query={{ include: "region", path: `thermocyclerprofile/${id}` }}
      >
        {({ loading, response }) => (
          <div className="container-fluid">
            <h1>
              <SeqdbMessage id="pcrProfileViewTitle" />
            </h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <Formik<PcrProfile> initialValues={response.data} onSubmit={noop}>
                <div>
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
              </Formik>
            )}
          </div>
        )}
      </Query>
    </div>
  );
}

export default withRouter(PcrProfileDetailsPage);
