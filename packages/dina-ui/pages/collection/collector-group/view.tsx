import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  FieldView,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Person } from "packages/dina-ui/types/agent-api/resources/Person";
import { CollectorGroup } from "packages/dina-ui/types/collection-api/resources/CollectorGroup";
import { useContext } from "react";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

export function CollectorGroupDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();
  const { bulkGet } = useContext(ApiClientContext);

  const collGroupQuery = useQuery<CollectorGroup>(
    { path: `collection-api/collector-group/${id}?include=agentIdentifiers` },
    {
      onSuccess: async ({ data: collGroup }) => {
        if (collGroup.agentIdentifiers) {
          collGroup.agents = await bulkGet<Person>(
            collGroup.agentIdentifiers.map(
              agent => `/person/${agent.id}`
            ) as any,
            { apiBaseUrl: "/agent-api" }
          );
        }
      }
    }
  );

  return (
    <div>
      <Head title={formatMessage("collectorGroupViewTitle")} />
      <Nav />
      <ButtonBar>
        <BackButton
          entityId={id as string}
          entityLink="/collection/collector-group"
          byPassView={true}
        />
      </ButtonBar>
      <main className="container-fluid">
        <h1>
          <DinaMessage id="collectorGroupViewTitle" />
        </h1>
        {withResponse(collGroupQuery, ({ data: collectorGroup }) => (
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
        ))}
      </main>
      <Footer />
    </div>
  );
}

export default withRouter(CollectorGroupDetailsPage);
