import { useQuery, withResponse } from "common-ui";
import { InputResource, KitsuResource, PersistedResource } from "kitsu";
import { isUndefined, mapValues, omitBy, toPairs, set } from "lodash";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { Head, Nav } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CollectingEvent,
  MaterialSample,
  PreparationProcessDefinition,
  TemplateFields
} from "../../../types/collection-api";
import { MaterialSampleForm } from "../material-sample/edit";

export default function CreateMaterialSampleFromWorkflowPage() {
  const router = useRouter();
  const {
    query: { id: actionDefinitionId }
  } = router;
  const { formatMessage } = useDinaIntl();

  const actionDefinitionQuery = useQuery<PreparationProcessDefinition>(
    {
      path: `collection-api/material-sample-action-definition/${actionDefinitionId}`
    },
    { disabled: !actionDefinitionId }
  );

  const pageTitle = `${formatMessage("runWorkflow")}${
    actionDefinitionQuery.response
      ? `: ${actionDefinitionQuery.response.data.name}`
      : ""
  }`;

  async function moveToViewPage(savedId: string) {
    await router.push(`/collection/material-sample/view?id=${savedId}`);
  }

  return (
    <div>
      <Head title={pageTitle} />
      <Nav />
      <div className="container-fluid">
        <h1>{pageTitle}</h1>
        {withResponse(actionDefinitionQuery, ({ data }) => (
          <CreateMaterialSampleFromWorkflowForm
            actionDefinition={data}
            onSaved={moveToViewPage}
          />
        ))}
      </div>
    </div>
  );
}

export interface CreateMaterialSampleFromWorkflowForm {
  actionDefinition: PersistedResource<PreparationProcessDefinition>;
  onSaved: (id: string) => Promise<void>;
}

export function CreateMaterialSampleFromWorkflowForm({
  actionDefinition,
  onSaved
}: CreateMaterialSampleFromWorkflowForm) {
  const { materialSampleInitialValues, collectingEventInitialValues } =
    useWorkflowMaterialSampleInitialValues(actionDefinition);

  return (
    <MaterialSampleForm
      materialSample={materialSampleInitialValues}
      collectingEventInitialValues={collectingEventInitialValues}
      onSaved={onSaved}
    />
  );
}

/** Gets the initial form values from the template default values. */
function useWorkflowMaterialSampleInitialValues(
  actionDefinition: PreparationProcessDefinition
) {
  return useMemo(() => {
    const materialSampleInitialValues = getInitialValuesFromTemplateFields(
      "material-sample",
      actionDefinition.formTemplates.MATERIAL_SAMPLE?.templateFields
    );

    const collectingEvent = getInitialValuesFromTemplateFields(
      "collecting-event",
      actionDefinition.formTemplates.COLLECTING_EVENT?.templateFields
    );

    if (collectingEvent.id) {
      materialSampleInitialValues.collectingEvent = {
        type: "collecting-event",
        id: collectingEvent.id
      };
    }

    const collectingEventInitialValues = collectingEvent.id
      ? undefined
      : collectingEvent;

    return { materialSampleInitialValues, collectingEventInitialValues };
  }, []);
}

/** Gets the form's initial values from the stored Template. */
function getInitialValuesFromTemplateFields<TResource extends KitsuResource>(
  type: TResource["type"],
  templateFields?: TemplateFields<TResource>
): InputResource<TResource> {
  const initialValues = { type } as InputResource<TResource>;
  for (const [key, val] of toPairs(templateFields)) {
    if (val?.enabled && val.defaultValue !== undefined) {
      set(initialValues, key, val.defaultValue);
    }
  }
  return initialValues;
}
