import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  FieldView,
  LoadingSpinner,
  Query
} from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { CollectorGroup } from "../../types/objectstore-api/resources/CollectorGroup";
import { useContext } from "react";
import { Person } from "packages/dina-ui/types/objectstore-api/resources/Person";

export function CollectorGroupDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();
  const { apiClient, bulkGet, save } = useContext(ApiClientContext);

  return (
    <div>
      <Head title={formatMessage("collectorGroupViewTitle")} />
      <Nav />
      <ButtonBar>
        <CancelButton
          entityId={id as string}
          entityLink="/collector-group"
          byPassView={true}
        />
      </ButtonBar>
      <Query<CollectorGroup>
        query={{ path: `collection-api/collector-group/${id}` }}
      >
        {({ loading, response }) => {
          const collectorGroup = response && {
            ...response.data
          };
          let agentsLoading = true;
          const renderView = () => {
            return (
              <main className="container-fluid">
                <h1>
                  <DinaMessage id="collectorGroupViewTitle" />
                </h1>
                <LoadingSpinner loading={loading || agentsLoading} />
                {collectorGroup && (
                  <Formik<CollectorGroup>
                    initialValues={collectorGroup}
                    onSubmit={noop}
                  >
                    <div>
                      <div className="row">
                        <FieldView
                          className="col-md-2"
                          name="name"
                          label={formatMessage("collectorGroupNameLabel")}
                        />
                        <FieldView
                          className="col-md-3"
                          name="agents"
                          label={formatMessage("collectorGroupAgentsLabel")}
                        />
                      </div>
                    </div>
                  </Formik>
                )}
              </main>
            );
          };

          if (collectorGroup && collectorGroup.createdOn) {
            const inUserTimeZone = new Date(
              collectorGroup.createdOn
            ).toString();
            collectorGroup.createdOn = inUserTimeZone;
          }

          if (collectorGroup && collectorGroup.agentIdentifiers) {
            const fetchAgents = async () => {
              const a = await bulkGet<Person>(
                collectorGroup.agentIdentifiers.map(
                  agentId => `/person/${agentId}`
                ),
                { apiBaseUrl: "/agent-api" }
              );
              return a;
            };
            const agents = fetchAgents();
            agents.then(async () => {
              collectorGroup.agents = await agents;
              renderView();
              agentsLoading = false;
            });
          }
          return renderView();
        }}
      </Query>
      <Footer />
    </div>
  );
}

export default withRouter(CollectorGroupDetailsPage);
