import { DinaForm, useApiClient } from "common-ui";
import { Person } from "packages/dina-ui/types/agent-api/resources/Person";
import { CollectorGroup } from "packages/dina-ui/types/collection-api/resources/CollectorGroup";
import { ViewPageLayout } from "../../../components";
import { CollectorGroupFields } from "./edit";

export default function CollectorGroupDetailsPage() {
  const { bulkGet } = useApiClient();

  return (
    <ViewPageLayout<CollectorGroup>
      form={props => (
        <DinaForm<CollectorGroup> {...props}>
          <CollectorGroupFields />
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
