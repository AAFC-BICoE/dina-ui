import { DinaForm } from "common-ui";
import { fromPairs } from "lodash";
import { ViewPageLayout } from "../../components";
import { AgentIdentifierType } from "../../types/agent-api/resources/AgentIdentifierType";
import { IdentifierTypeFormLayout } from "./edit";

export default function IdentifierTypeDetailsPage() {
  return (
    <ViewPageLayout<AgentIdentifierType>
      form={(props) => (
        <DinaForm<AgentIdentifierType>
          {...props}
          initialValues={{
            ...props.initialValues,
            // Convert multilingualTitle to editable Dictionary format:
            multilingualTitle: fromPairs<string | undefined>(
              props.initialValues.multilingualTitle?.titles?.map(
                ({ title, lang }) => [lang ?? "", title ?? ""]
              )
            )
          }}
        >
          <IdentifierTypeFormLayout />
        </DinaForm>
      )}
      query={(id) => ({
        path: `agent-api/identifier-type/${id}`
      })}
      entityLink="/identifier"
      type="identifier-type"
      apiBaseUrl="/agent-api"
      showDeleteButton={false}
    />
  );
}
