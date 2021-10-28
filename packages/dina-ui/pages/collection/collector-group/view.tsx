import { DinaForm, FieldView, useApiClient } from "common-ui";
import { Person } from "packages/dina-ui/types/agent-api/resources/Person";
import { CollectorGroup } from "packages/dina-ui/types/collection-api/resources/CollectorGroup";
import { ViewPageLayout } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

export default function CollectorGroupDetailsPage() {
  const { bulkGet } = useApiClient();
  const { formatMessage } = useDinaIntl();

  return (
    <ViewPageLayout<CollectorGroup>
      form={props => (
        <DinaForm<CollectorGroup> {...props}>
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
        </DinaForm>
      )}
      query={id => ({
        path: `collection-api/collector-group/${id}?include=agentIdentifiers`
      })}
      queryOptions={{
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
      }}
      entityLink="/collection/collector-group"
      type="collector-group"
      apiBaseUrl="/collection-api"
    />
  );
}
