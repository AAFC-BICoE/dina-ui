import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  ErrorViewer,
  LoadingSpinner,
  Query,
  safeSubmit,
  SubmitButton,
  TextField
} from "common-ui";
import { Form, Formik } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";
import { Agent } from "types/objectstore-api/resources/Agent";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

interface AgentFormProps {
  agent?: Agent;
  router: NextRouter;
}

export function AgentEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("editAgentTitle")} />
      <Nav />
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>
              <DinaMessage id="editAgentTitle" />
            </h1>
            <Query<Agent> query={{ path: `agent-api/agent/${id}` }}>
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <AgentForm agent={response.data} router={router} />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>
              <DinaMessage id="addAgentTitle" />
            </h1>
            <AgentForm router={router} />
          </div>
        )}
      </div>
    </div>
  );
}

function AgentForm({ agent, router }: AgentFormProps) {
  const { save } = useContext(ApiClientContext);
  const { id } = router.query;
  const initialValues = agent || { type: "agent" };

  const onSubmit = safeSubmit(async submittedValues => {
    await save(
      [
        {
          resource: submittedValues,
          type: "agent"
        }
      ],
      {
        apiBaseUrl: "/agent-api"
      }
    );

    await router.push(`/agent/list`);
  });

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form>
        <ErrorViewer />
        <ButtonBar>
          <SubmitButton />
          <CancelButton
            entityId={id as string}
            entityLink="/agent"
            byPassView={true}
          />
        </ButtonBar>
        <div>
          <div className="row">
            <TextField className="col-md-4" name="displayName" />
          </div>
          <div className="row">
            <TextField className="col-md-4" name="email" />
          </div>
        </div>
      </Form>
    </Formik>
  );
}

export default withRouter(AgentEditPage);
