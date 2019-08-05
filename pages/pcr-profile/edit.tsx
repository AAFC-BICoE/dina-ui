import { Form, Formik, FormikActions } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";
import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  ErrorViewer,
  Head,
  LoadingSpinner,
  Nav,
  Query,
  ResourceSelectField,
  SubmitButton,
  TextField
} from "../../components";
import { Group } from "../../types/seqdb-api/resources/Group";
import { PcrProfile } from "../../types/seqdb-api/resources/PcrProfile";
import { Region } from "../../types/seqdb-api/resources/Region";
import { filterBy } from "../../util/rsql";

interface PcrProfileFormProps {
  profile?: PcrProfile;
  router: NextRouter;
}

export function PcrProfileEditPage({ router }: WithRouterProps) {
  const { id } = router.query;

  return (
    <div>
      <Head title="Edit PCR Profile" />
      <Nav />
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>Edit Thermocycler Profile</h1>
            <Query<PcrProfile>
              query={{
                include: "group,region",
                path: `thermocyclerprofile/${id}`
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
            <h1>Add Thermocycler Profile</h1>
            <PcrProfileForm router={router} />
          </div>
        )}
      </div>
    </div>
  );
}

function PcrProfileForm({ profile, router }: PcrProfileFormProps) {
  const { save } = useContext(ApiClientContext);
  const { id } = router.query;
  const initialValues = profile || { type: "thermocyclerprofile" };

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const response = await save([
        {
          resource: submittedValues,
          type: "thermocyclerprofile"
        }
      ]);

      const newId = response[0].id;
      router.push(`/pcr-profile/view?id=${newId}`);
    } catch (error) {
      setStatus(error.message);
      setSubmitting(false);
    }
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form>
        <ErrorViewer />
        <ButtonBar>
          <SubmitButton />
          <CancelButton entityId={id as string} entityLink="pcr-profile" />
        </ButtonBar>
        <div>
          <div className="row">
            <ResourceSelectField<Group>
              className="col-md-2"
              name="group"
              filter={filterBy(["groupName"])}
              model="group"
              optionLabel={group => group.groupName}
            />
          </div>
          <div className="row">
            <ResourceSelectField<Region>
              className="col-md-2"
              name="region"
              filter={filterBy(["name"])}
              label="Select Gene Region"
              model="region"
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
      </Form>
    </Formik>
  );
}

export default withRouter(PcrProfileEditPage);
