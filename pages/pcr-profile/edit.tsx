import { Form, Formik, FormikActions } from "formik";
import { SingletonRouter, withRouter, WithRouterProps } from "next/router";
import { useContext } from "react";
import {
  ApiClientContext,
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
import { serialize } from "../../util/serialize";

interface PcrProfileFormProps {
  profile?: PcrProfile;
  router: SingletonRouter;
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
            <h1>Edit PCR Profile</h1>
            <Query<PcrProfile>
              query={{ include: "group,region", path: `thermocyclerprofile/${id}` }}
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
              <h1>Add PCR Profile</h1>
              <PcrProfileForm router={router} />
            </div>
          )}
      </div>
    </div>
  );
}

function PcrProfileForm({ profile, router }: PcrProfileFormProps) {
  const { doOperations } = useContext(ApiClientContext);

  const initialValues = profile || { type: "thermocyclerprofile" };

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const serialized = await serialize({
        resource: submittedValues,
        type: "thermocyclerprofile"
      });

      const op = submittedValues.id ? "PATCH" : "POST";

      if (op === "POST") {
        serialized.id = -100;
      }

      const response = await doOperations([
        {
          op,
          path: op === "PATCH" ? `thermocyclerprofile/${profile.id}` : "thermocyclerprofile",
          value: serialized
        }
      ]);

      const newId = response[0].data.id;
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
        <div>
          <div className="row">
            <ResourceSelectField<Group>
              className="col-md-2"
              name="group"
              filter={groupName => ({ groupName })}
              model="group"
              optionLabel={group => group.groupName}
            />
          </div>
          <div className="row">
            <ResourceSelectField<Region>
              className="col-md-2"
              name="region"
              filter={name => ({ name })}
              label="Select Gene Region"
              model="region"
              optionLabel={region => region.name}
            />
            <TextField className="col-md-2" name="name" label="Thermocycler Profile Name" />
            <TextField className="col-md-2" name="application" />
            <TextField className="col-md-2" name="cycles" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="step 1" />
            <TextField className="col-md-2" name="step 11" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="step 2" />
            <TextField className="col-md-2" name="step 12" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="step 3" />
            <TextField className="col-md-2" name="step 13" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="step 4" />
            <TextField className="col-md-2" name="step 14" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="step 5" />
            <TextField className="col-md-2" name="step 15" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="step 6" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="step 7" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="step 8" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="step 9" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="step 10" />
          </div>
          <SubmitButton />
        </div>
      </Form>
    </Formik >
  );
}

export default withRouter(PcrProfileEditPage);
