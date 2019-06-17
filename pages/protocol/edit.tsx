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
import { filterBy } from "../../util/rsql";
import { serialize } from "../../util/serialize";
import { Protocol } from "types/seqdb-api/resources/Protocol";
import { Product } from "types/seqdb-api/resources/Product";

interface ProtocolFormProps {
  protocol?: Protocol;
  router: SingletonRouter;
}

export function ProtocolEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  return (
    <div>
      <Head title="Edit Protocol" />
      <Nav />
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>Edit Protocol</h1>
            <Query<Protocol> query={{ include: "group", path: `protocol/${id}` }}>
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <ProtocolForm protocol={response.data} router={router} />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
            <div>
              <h1>Add Protocol</h1>
              <ProtocolForm router={router} />
            </div>
          )}
      </div>
    </div>
  );
}

function ProtocolForm({ protocol, router }: ProtocolFormProps) {
  const { doOperations } = useContext(ApiClientContext);
  const initialValues = protocol || {};

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      //override the product type with "product" when kit is available
      if (submittedValues.kit)
        submittedValues.kit.type = "product";

      const serialized = await serialize({
        resource: submittedValues,
        type: "protocol"
      });
      const op = submittedValues.id ? "PATCH" : "POST";

      if (op === "POST") {
        serialized.id = -100;
      }

      const response = await doOperations([
        {
          op,
          path: op === "PATCH" ? `protocol/${protocol.id}` : "protocol",
          value: serialized
        }
      ]);

      const newId = response[0].data.id;
      router.push(`/protocol/view?id=${newId}`);
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
              filter={filterBy(["groupName"])}
              model="group"
              optionLabel={group => group.groupName}
            />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="type" />
            <TextField className="col-md-2" name="name" />
            <TextField className="col-md-2" name="version" />
            <TextField className="col-md-2" name="description" />
          </div>
          <div className="row">
            <TextField className="col-md-8" name="steps" />
          </div>
          <div className="row">
            <TextField className="col-md-8" name="notes" />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="reference" />
            <TextField className="col-md-2" name="equipment" />
            <ResourceSelectField<Product>
              className="col-md-4"
              name="kit"
              filter={filterBy(["name"])}
              model="product"
              optionLabel={product => product.name}
            />
          </div>
          <SubmitButton />
        </div>
      </Form>
    </Formik>
  );
}
export default withRouter(ProtocolEditPage);
