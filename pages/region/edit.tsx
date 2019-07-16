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
  SubmitButton,
  TextField
} from "../../components";
import { Region } from "../../types/seqdb-api/resources/Region";
import { serialize } from "../../util/serialize";

interface RegionFormProps {
  region?: Region;
  router: SingletonRouter;
}

export function RegionEditPage({ router }: WithRouterProps) {
  const { id } = router.query;

  return (
    <div>
      <Head title="Edit Gene Region" />
      <Nav />
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>Edit Gene Region</h1>
            <Query<Region> query={{ path: `region/${id}` }}>
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <RegionForm region={response.data} router={router} />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>Add Gene Region</h1>
            <RegionForm router={router} />
          </div>
        )}
      </div>
    </div>
  );
}

function RegionForm({ region, router }: RegionFormProps) {
  const { doOperations } = useContext(ApiClientContext);

  const initialValues = region || {};

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      const serialized = await serialize({
        resource: submittedValues,
        type: "region"
      });

      const op = submittedValues.id ? "PATCH" : "POST";

      if (op === "POST") {
        serialized.id = -100;
      }

      const response = await doOperations([
        {
          op,
          path: op === "PATCH" ? `region/${region.id}` : "region",
          value: serialized
        }
      ]);

      const newId = response[0].data.id;
      router.push(`/region/view?id=${newId}`);
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
            <TextField className="col-md-2" name="name" />
            <TextField className="col-md-2" name="symbol" />
            <TextField className="col-md-2" name="description" />
          </div>
          <SubmitButton />
        </div>
      </Form>
    </Formik>
  );
}

export default withRouter(RegionEditPage);
