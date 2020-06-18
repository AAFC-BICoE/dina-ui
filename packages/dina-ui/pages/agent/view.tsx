import {
  ButtonBar,
  CancelButton,
  EditButton,
  FieldView,
  LoadingSpinner,
  Query
} from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Agent } from "types/objectstore-api/resources/Agent";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export function AgentDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("agentViewTitle")} />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="agent" />
        <CancelButton
          entityId={id as string}
          entityLink="agent"
          byPassView={true}
        />
      </ButtonBar>
      <Query<Agent> query={{ path: `agent-api/agent/${id}` }}>
        {({ loading, response }) => {
          const agent = response && {
            ...response.data
          };

          return (
            <div className="container-fluid">
              <h1>
                <DinaMessage id="agentViewTitle" />
              </h1>
              <LoadingSpinner loading={loading} />
              {agent && (
                <Formik<Agent> initialValues={agent} onSubmit={noop}>
                  <div>
                    <div className="row">
                      <FieldView className="col-md-4" name="displayName" />
                      <FieldView className="col-md-4" name="email" />
                    </div>
                  </div>
                </Formik>
              )}
            </div>
          );
        }}
      </Query>
    </div>
  );
}

export default withRouter(AgentDetailsPage);
