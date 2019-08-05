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
  SelectField,
  SubmitButton,
  TextField
} from "../../components";
import { Group } from "../../types/seqdb-api/resources/Group";
import { Product } from "../../types/seqdb-api/resources/Product";
import {
  Protocol,
  protocolTypeLabels
} from "../../types/seqdb-api/resources/Protocol";
import { filterBy } from "../../util/rsql";

interface ProtocolFormProps {
  protocol?: Protocol;
  router: NextRouter;
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
            <Query<Protocol>
              query={{ include: "group,kit", path: `protocol/${id}` }}
            >
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
  const { save } = useContext(ApiClientContext);
  const { id } = router.query;
  const initialValues = protocol || {};

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      // Override the product type with "product" when kit is available
      if (submittedValues.kit) {
        submittedValues.kit.type = "product";
      }

      const response = await save([
        {
          resource: submittedValues,
          type: "protocol"
        }
      ]);

      const newId = response[0].id;
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
        <ButtonBar>
          <SubmitButton />
          <CancelButton entityId={id as string} entityLink="protocol" />
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
            <SelectField
              className="col-md-2"
              name="type"
              label="Potocol Type"
              options={PROTOCOL_TYPE_OPTIONS}
            />
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
        </div>
      </Form>
    </Formik>
  );
}

const PROTOCOL_TYPE_OPTIONS = [
  "COLLECTION_EVENT",
  "DNA_EXTRACTION",
  "PCR_REACTION",
  "SEQ_REACTION",
  "SPECIMEN_PREPARATION"
].map(value => ({ value, label: protocolTypeLabels[value] }));

export default withRouter(ProtocolEditPage);
