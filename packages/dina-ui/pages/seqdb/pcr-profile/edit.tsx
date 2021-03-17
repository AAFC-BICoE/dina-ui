import {
  ButtonBar,
  BackButton,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  LoadingSpinner,
  Query,
  ResourceSelectField,
  SubmitButton,
  TextField
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrProfile } from "../../../types/seqdb-api/resources/PcrProfile";
import { Region } from "../../../types/seqdb-api/resources/Region";

interface PcrProfileFormProps {
  profile?: PcrProfile;
  router: NextRouter;
}

export function PcrProfileEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("editPcrProfileTitle")} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1>
              <SeqdbMessage id="editPcrProfileTitle" />
            </h1>
            <Query<PcrProfile>
              query={{
                include: "region",
                path: `seqdb-api/thermocyclerprofile/${id}`
              }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <PcrProfileForm profile={response.data} router={router} />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>
              <SeqdbMessage id="addPcrProfileTitle" />
            </h1>
            <PcrProfileForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function PcrProfileForm({ profile, router }: PcrProfileFormProps) {
  const { id } = router.query;

  const initialValues = profile || {
    type: "thermocyclerprofile"
  };

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    const response = await save(
      [
        {
          resource: submittedValues,
          type: "thermocyclerprofile"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/seqdb/pcr-profile/view?id=${newId}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <SubmitButton />
        <BackButton entityId={id as string} entityLink="/seqdb/pcr-profile" />
      </ButtonBar>
      <div>
        <div className="row">
          <GroupSelectField
            className="col-md-2"
            name="group"
            enableStoredDefaultGroup={true}
          />
        </div>
        <div className="row">
          <ResourceSelectField<Region>
            className="col-md-2"
            name="region"
            filter={filterBy(["name"])}
            label="Select Gene Region"
            model="seqdb-api/region"
            optionLabel={region => region.name}
          />
          <TextField
            className="col-md-2"
            name="name"
            label="Thermocycler Profile Name"
          />
          <TextField className="col-md-2" name="application" />
          <TextField className="col-md-2" name="cycles" />
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="card-group row" style={{ padding: 15 }}>
              <div className="card card-body col-md-4">
                <TextField name="step1" />
                <TextField name="step2" />
                <TextField name="step3" />
                <TextField name="step4" />
                <TextField name="step5" />
              </div>
              <div className="card card-body col-md-4">
                <TextField name="step6" />
                <TextField name="step7" />
                <TextField name="step8" />
                <TextField name="step9" />
                <TextField name="step10" />
              </div>
              <div className="card card-body col-md-4">
                <TextField name="step11" />
                <TextField name="step12" />
                <TextField name="step13" />
                <TextField name="step14" />
                <TextField name="step15" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DinaForm>
  );
}

export default withRouter(PcrProfileEditPage);
