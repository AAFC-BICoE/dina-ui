import { DinaForm, processExtensionValuesLoading } from "common-ui";
import _ from "lodash";
import { AgentRole } from "packages/dina-ui/types/loan-transaction-api";
import { ViewPageLayout } from "../../../components";
import { ProjectFormLayout } from "../../../components/project/ProjectFormLayout";
import { Project } from "../../../types/collection-api/resources/Project";

export default function ProjectDetailsPage() {
  return (
    <ViewPageLayout<Project>
      form={(props) => (
        <DinaForm<Project>
          {...props}
          initialValues={{
            ...props.initialValues,
            // Convert multilingualDescription to editable Dictionary format:
            multilingualDescription: _.fromPairs<string | undefined>(
              props.initialValues.multilingualDescription?.descriptions?.map(
                ({ desc, lang }) => [lang ?? "", desc ?? ""]
              )
            ),
            extensionValues: props.initialValues.extensionValues
              ? processExtensionValuesLoading(
                  props.initialValues.extensionValues
                )
              : undefined,
            contributors: (props.initialValues.contributors ?? []).map(
              (agentRole) =>
                ({
                  ...agentRole,
                  agent: { id: agentRole.agent, type: "person" }
                } as AgentRole)
            )
          }}
        >
          <ProjectFormLayout />
        </DinaForm>
      )}
      query={(id) => ({
        path: `collection-api/project/${id}?include=attachment`
      })}
      entityLink="/collection/project"
      type="project"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
