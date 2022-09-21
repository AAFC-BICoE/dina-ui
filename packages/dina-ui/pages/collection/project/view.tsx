import { DinaForm } from "common-ui";
import { fromPairs } from "lodash";
import { ViewPageLayout } from "../../../components";
import { Project } from "../../../types/collection-api/resources/Project";
import { ProjectFormLayout } from "../../../components/project/ProjectFormLayout";

export default function ProjectDetailsPage() {
  return (
    <ViewPageLayout<Project>
      form={(props) => (
        <DinaForm<Project>
          {...props}
          initialValues={{
            ...props.initialValues,
            // Convert multilingualDescription to editable Dictionary format:
            multilingualDescription: fromPairs<string | undefined>(
              props.initialValues.multilingualDescription?.descriptions?.map(
                ({ desc, lang }) => [lang ?? "", desc ?? ""]
              )
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
