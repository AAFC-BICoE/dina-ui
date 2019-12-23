import {
  ApiClientContext,
  ErrorViewer,
  filterBy,
  LoadingSpinner,
  Query,
  ResourceSelectField,
  SubmitButton,
  TextField
} from "common-ui";
import { Form, Formik, FormikActions } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";
import { Head, Nav } from "../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../intl/seqdb-intl";
import { Chain } from "../../types/seqdb-api";
import { Group } from "../../types/seqdb-api/resources/Group";

interface ChainFormProps {
  chain?: any;
  router: NextRouter;
}

export function ChainEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("editWorkflowTitle")} />
      <Nav />
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>
              <SeqdbMessage id="editWorkflowTitle" />
            </h1>
            <Query<Chain>
              query={{ include: "chainTemplate,group", path: `workflow/${id}` }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <ChainForm chain={response.data} router={router} />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>
              <SeqdbMessage id="addWorkflowTitle" />
            </h1>
            <ChainForm router={router} />
          </div>
        )}
      </div>
    </div>
  );
}

function ChainForm({ chain, router }: ChainFormProps) {
  const { save } = useContext(ApiClientContext);

  const initialValues = chain || {};

  async function onSubmit(
    submittedValues,
    { setStatus, setSubmitting }: FormikActions<any>
  ) {
    try {
      // Current date as yyyy-mm-dd string.
      const dateCreated = new Date().toISOString().split("T")[0];
      submittedValues.dateCreated = dateCreated;

      const response = await save([
        {
          resource: submittedValues,
          type: "chain"
        }
      ]);

      const newId = response[0].id;
      router.push(`/workflow/view?id=${newId}`);
    } catch (error) {
      setStatus(error.message);
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="container-fluid">
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
          <Form>
            <ErrorViewer />
            <div className="row">
              <ResourceSelectField<any>
                className="col-md-2"
                label="Workflow Template"
                name="chainTemplate"
                filter={filterBy(["name"])}
                model="chainTemplate"
                optionLabel={template => template.name}
              />
            </div>
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
              <TextField className="col-md-2" name="name" />
            </div>
            <SubmitButton />
          </Form>
        </Formik>
      </div>
    </div>
  );
}

export default withRouter(ChainEditPage);
