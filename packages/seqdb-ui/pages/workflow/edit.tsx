import {
  ApiClientContext,
  ErrorViewer,
  filterBy,
  LoadingSpinner,
  Query,
  ResourceSelectField,
  safeSubmit,
  SubmitButton,
  TextField
} from "common-ui";
import { Form, Formik } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";
import { Head, Nav } from "../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../intl/seqdb-intl";
import { Chain, ChainTemplate } from "../../types/seqdb-api";

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
              query={{
                include: "chainTemplate",
                path: `seqdb-api/chain/${id}`
              }}
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

  const onSubmit = safeSubmit(async submittedValues => {
    // Current date as yyyy-mm-dd string.
    const dateCreated = new Date().toISOString().split("T")[0];
    submittedValues.dateCreated = dateCreated;

    const response = await save(
      [
        {
          resource: submittedValues,
          type: "chain"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/workflow/view?id=${newId}`);
  });

  return (
    <div>
      <div className="container-fluid">
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
          <Form translate={undefined}>
            <ErrorViewer />
            <div className="row">
              <ResourceSelectField<ChainTemplate>
                className="col-md-2"
                label="Workflow Template"
                name="chainTemplate"
                filter={filterBy(["name"])}
                model="seqdb-api/chainTemplate"
                optionLabel={template => template.name}
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
