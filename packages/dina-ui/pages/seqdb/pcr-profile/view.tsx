import {
  BackToListButton,
  ButtonBar,
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
import { PcrProfile } from "../../../types/seqdb-api/resources/PcrProfile";

export function PcrProfileDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("pcrProfileViewTitle")}
						lang={formatMessage("languageOfPage")} 
						creator={formatMessage("agricultureCanada")}
						subject={formatMessage("subjectTermsForPage")} />
			<Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="seqdb/pcr-profile" />
        <BackToListButton entityLink="/seqdb/pcr-profile" />
      </ButtonBar>
      <Query<PcrProfile>
        query={{
          include: "region",
          path: `seqdb-api/thermocycler-profile/${id}`
        }}
      >
        {({ loading, response }) => (
          <main className="container-fluid">
            <h1 id="wb-cont">
              <SeqdbMessage id="pcrProfileViewTitle" />
            </h1>
            <LoadingSpinner loading={loading} />
            {response && (
              <DinaForm<PcrProfile> initialValues={response.data}>
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
          </main>
        )}
      </Query>
    </div>
  );
}

export default withRouter(PcrProfileDetailsPage);
