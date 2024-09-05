import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  processExtensionValuesLoading,
  processExtensionValuesSaving,
  SubmitButton,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { fromPairs, toPairs } from "lodash";
import { useRouter } from "next/router";
import { useContext } from "react";
import { Project } from "../../../types/collection-api/resources/Project";
import { ProjectFormLayout } from "../../../components/project/ProjectFormLayout";
import PageLayout from "../../../components/page/PageLayout";

interface ProjectFormProps {
  fetchedProject?: Project;
  onSaved: (project: PersistedResource<Project>) => Promise<void>;
}

export default function ProjectEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;

  async function goToViewPage(project: PersistedResource<Project>) {
    await router.push(`/collection/project/view?id=${project.id}`);
  }

  const title = id ? "editProjectTitle" : "addProjectTitle";

  const query = useQuery<Project>({
    path: `collection-api/project/${id}?include=attachment`
  });

  return (
    <PageLayout titleId={title}>
      <div>
        {id ? (
          withResponse(query, ({ data }) => (
            <ProjectForm fetchedProject={data} onSaved={goToViewPage} />
          ))
        ) : (
          <ProjectForm onSaved={goToViewPage} />
        )}
      </div>
    </PageLayout>
  );
}

export interface ProjectFormValues extends InputResource<Project> {}

export function ProjectForm({ fetchedProject, onSaved }: ProjectFormProps) {
  const { save } = useContext(ApiClientContext);
  // Process loaded back-end data into data structure that Forkmiks can use
  if (fetchedProject?.extensionValues) {
    fetchedProject.extensionValues = processExtensionValuesLoading(
      fetchedProject.extensionValues
    );
  }
  const initialValues: ProjectFormValues = fetchedProject
    ? {
        ...fetchedProject,
        // Convert multilingualDescription to editable Dictionary format:
        multilingualDescription: fromPairs<string | undefined>(
          fetchedProject.multilingualDescription?.descriptions?.map(
            ({ desc, lang }) => [lang ?? "", desc ?? ""]
          )
        )
      }
    : { type: "project" };

  const onSubmit: DinaFormOnSubmit<ProjectFormValues> = async ({
    submittedValues
  }) => {
    (submittedValues as any).relationships = {};
    if (submittedValues.extensionValues) {
      submittedValues.extensionValues = processExtensionValuesSaving(
        submittedValues.extensionValues
      );
    }
    const input: InputResource<Project> = {
      ...submittedValues,
      // Convert the editable format to the stored format:
      multilingualDescription: {
        descriptions: toPairs(submittedValues.multilingualDescription).map(
          ([lang, desc]) => ({ lang, desc })
        )
      }
    };

    // Add attachments if they were selected:
    (input as any).relationships.attachment = {
      data:
        input.attachment?.map((it) => ({
          id: it.id,
          type: it.type
        })) ?? []
    };

    // Delete the 'attachment' attribute because it should stay in the relationships field:
    delete input.attachment;

    const [savedProject] = await save<Project>(
      [
        {
          resource: input,
          type: "project"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );
    await onSaved(savedProject);
  };

  return (
    <DinaForm<ProjectFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar className="mb-4">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={fetchedProject?.id}
            entityLink="/collection/project"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <ProjectFormLayout />
    </DinaForm>
  );
}
