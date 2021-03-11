import {
  ApiClientContext,
  ButtonBar,
  BackButton,
  DinaForm,
  FieldView,
  LoadingSpinner,
  Query
} from "common-ui";
import { KitsuResponse } from "kitsu";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { CollectorGroup } from "packages/dina-ui/types/collection-api/resources/CollectorGroup";
import { Person } from "packages/dina-ui/types/agent-api/resources/Person";
import { useContext, useState } from "react";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export function CollectorGroupDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();
  const { bulkGet } = useContext(ApiClientContext);
  const [collectorGroup, setCollectorGroup] = useState<CollectorGroup>();

  const getAgents = (response: KitsuResponse<CollectorGroup, undefined>) => {
    const fetchAgents = async () => {
      if (response?.data?.agentIdentifiers) {
        return await bulkGet<Person>(
          response?.data?.agentIdentifiers.map(
            agent => `/person/${agent.id}`
          ) as any,
          { apiBaseUrl: "/agent-api" }
        );
      }
    };
    const agents = fetchAgents();
    agents.then(async () => {
      response.data.agents = await agents;
      setCollectorGroup(response.data);
    });
  };

  return (
    <div>
      <Head title={formatMessage("collectorGroupViewTitle")} />
      <Nav />
      <ButtonBar>
        <BackButton
          entityId={id as string}
          entityLink="/collector-group"
          byPassView={true}
        />
      </ButtonBar>
      <Query<CollectorGroup>
        query={{
          path: `collection-api/collector-group/${id}?include=agentIdentifiers`
        }}
        onSuccess={getAgents}
      >
        {({ loading }) => {
          if (collectorGroup && collectorGroup.createdOn) {
            const inUserTimeZone = new Date(
              collectorGroup.createdOn
            ).toString();
            collectorGroup.createdOn = inUserTimeZone;
          }

          return (
            <main className="container-fluid">
              <h1>
                <DinaMessage id="collectorGroupViewTitle" />
              </h1>
              <LoadingSpinner loading={loading} />
              {collectorGroup && (
                <DinaForm<CollectorGroup> initialValues={collectorGroup}>
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
                </DinaForm>
              )}
            </main>
          );
        }}
      </Query>
      <Footer />
    </div>
  );
}

export default withRouter(CollectorGroupDetailsPage);
