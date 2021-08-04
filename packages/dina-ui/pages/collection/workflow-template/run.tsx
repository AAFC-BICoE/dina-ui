import {
  BackButton,
  ButtonBar,
  SubmitButton,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, KitsuResource, PersistedResource } from "kitsu";
import { compact, isNil, set, toPairs, pick } from "lodash";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { Head, Nav } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  PreparationProcessDefinition,
  TemplateFields
} from "../../../types/collection-api";
import { MaterialSampleForm } from "../material-sample/edit";
import { DinaMessage } from "../../../intl/dina-ui-intl";

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

  async function moveToSampleViewPage(id: string) {
    await router.push(`/collection/material-sample/view?id=${id}`);
  }

  async function moveToNewRunPage() {
    await router.reload();
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
            moveToNewRunPage={moveToNewRunPage}
            moveToSampleViewPage={moveToSampleViewPage}
          />
        ))}
      </div>
    </div>
  );
}

export interface CreateMaterialSampleFromWorkflowForm {
  actionDefinition: PersistedResource<PreparationProcessDefinition>;
  moveToSampleViewPage: (id: string) => Promise<void>;
  moveToNewRunPage: () => Promise<void>;
}

export function CreateMaterialSampleFromWorkflowForm({
  actionDefinition,
  moveToSampleViewPage,
  moveToNewRunPage
}: CreateMaterialSampleFromWorkflowForm) {
  const {
    materialSampleInitialValues,
    collectingEventInitialValues,
    enabledFields
  } = useWorkflowMaterialSampleInitialValues(actionDefinition);

  type RoutingButtonStrings = "newRun" | "viewSample";

  /* Route to either new workflow run page with the same tempalte id or
  material sample list page based on button clicked */
  function selectOnSaved(routeString: RoutingButtonStrings) {
    return routeString === "newRun" ? moveToNewRunPage : moveToSampleViewPage;
  }

  const [onSaveString, setOnSaveString] = useState("viewSample");

  return (
    <MaterialSampleForm
      buttonBar={
        <ButtonBar className="d-flex">
          <BackButton
            entityLink="/collection/workflow-template"
            className="flex-grow-1"
          />
          <SubmitButton
            buttonProps={() => ({
              onClick: () => setOnSaveString("newRun"),
              style: { width: "20rem" }
            })}
          >
            <DinaMessage id="saveAndCreateNewMaterialSampleButton" />
          </SubmitButton>
          <SubmitButton
            buttonProps={() => ({
              onClick: () => setOnSaveString("viewSample"),
              style: { width: "15rem" }
            })}
          >
            <DinaMessage id="saveAndGoToViewPageButton" />
          </SubmitButton>
        </ButtonBar>
      }
      materialSample={materialSampleInitialValues}
      collectingEventInitialValues={collectingEventInitialValues}
      onSaved={selectOnSaved(onSaveString as RoutingButtonStrings)}
      enabledFields={enabledFields}
      attachmentsConfig={{
        collectingEvent: pick(
          actionDefinition.formTemplates.COLLECTING_EVENT,
          "allowNew",
          "allowExisting"
        ),
        materialSample: pick(
          actionDefinition.formTemplates.MATERIAL_SAMPLE,
          "allowNew",
          "allowExisting"
        )
      }}
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

    if (!materialSampleInitialValues.determination) {
      materialSampleInitialValues.determination = [{}];
    }

    const collectingEvent = getInitialValuesFromTemplateFields(
      "collecting-event",
      actionDefinition.formTemplates.COLLECTING_EVENT?.templateFields
    );

    if (collectingEvent.id) {
      materialSampleInitialValues.collectingEvent = {
        type: "collecting-event",
        id: collectingEvent.id
      };
    } else {
      set(collectingEvent, "geoReferenceAssertions[0].isPrimary", true);
    }

    const collectingEventInitialValues = collectingEvent.id
      ? undefined
      : collectingEvent;

    const enabledFields = {
      materialSample: [
        ...compact(
          toPairs(
            actionDefinition.formTemplates.MATERIAL_SAMPLE?.templateFields
          ).map(([key, val]) => (val?.enabled ? key : null))
        ),
        // The group field should always be enabled:
        "group"
      ],
      collectingEvent: compact(
        toPairs(
          actionDefinition.formTemplates.COLLECTING_EVENT?.templateFields
        ).map(([key, val]) => (val?.enabled ? key : null))
      )
    };

    return {
      materialSampleInitialValues,
      collectingEventInitialValues,
      enabledFields
    };
  }, [actionDefinition]);
}

/** Gets the form's initial values from the stored Template. */
function getInitialValuesFromTemplateFields<TResource extends KitsuResource>(
  type: TResource["type"],
  templateFields?: TemplateFields<TResource>
): InputResource<TResource> {
  const initialValues = { type } as InputResource<TResource>;
  for (const [key, val] of toPairs(templateFields)) {
    if (val?.enabled && !isNil(val.defaultValue)) {
      set(initialValues, key, val.defaultValue);
    }
  }
  return initialValues;
}
