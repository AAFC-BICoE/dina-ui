import {
  BackButton,
  ButtonBar,
  SubmitButton,
  useQuery,
  withResponse
} from "common-ui";
import { InputResource, KitsuResource, PersistedResource } from "kitsu";
import { compact, isNil, pick, set, toPairs } from "lodash";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  AcquisitionEvent,
  CollectingEvent,
  CustomView,
  MaterialSample,
  MaterialSampleFormViewConfig,
  materialSampleFormViewConfigSchema,
  TemplateFields
} from "../../../types/collection-api";
import { MaterialSampleForm } from "../material-sample/edit";

export default function CreateMaterialSampleFromWorkflowPage() {
  const router = useRouter();
  const {
    query: { id: actionDefinitionId }
  } = router;
  const { formatMessage } = useDinaIntl();

  const actionDefinitionQuery = useQuery<CustomView>(
    { path: `collection-api/custom-view/${actionDefinitionId}` },
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
        <h1 id="wb-cont">{pageTitle}</h1>
        {withResponse(actionDefinitionQuery, ({ data }) => {
          const viewConfig = materialSampleFormViewConfigSchema.parse(
            data.viewConfiguration
          );

          return (
            <CreateMaterialSampleFromWorkflowForm
              actionDefinition={viewConfig}
              moveToNewRunPage={moveToNewRunPage}
              moveToSampleViewPage={moveToSampleViewPage}
            />
          );
        })}
      </div>
    </div>
  );
}

export interface CreateMaterialSampleFromWorkflowForm {
  actionDefinition: MaterialSampleFormViewConfig;
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
    acquisitionEventInitialValues,
    enabledFields
  } = useWorkflowMaterialSampleInitialValues(actionDefinition);

  type RoutingButtonStrings = "newRun" | "viewSample";

  /* Route to either new workflow run page with the same tempalte id or
  material sample list page based on button clicked */
  function selectOnSaved(routeString: RoutingButtonStrings) {
    return routeString === "newRun" ? moveToNewRunPage : moveToSampleViewPage;
  }

  const [onSaveString, setOnSaveString] =
    useState<RoutingButtonStrings>("viewSample");

  return (
    <MaterialSampleForm
      enableStoredDefaultGroup={true}
      buttonBar={
        <ButtonBar className="d-flex">
          <BackButton
            entityLink="/collection/material-sample-custom-view"
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
      acquisitionEventInitialValues={acquisitionEventInitialValues}
      onSaved={selectOnSaved(onSaveString)}
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
  actionDefinition: MaterialSampleFormViewConfig
) {
  return useMemo(() => {
    const materialSampleInitialValues =
      getInitialValuesFromTemplateFields<MaterialSample>(
        "material-sample",
        actionDefinition.formTemplates.MATERIAL_SAMPLE?.templateFields
      );

    /* If no template entrry for determination or there is only one determination, make it primary
     * same as georeference assertion */
    materialSampleInitialValues.organism =
      materialSampleInitialValues.organism?.map(org => {
        if (!org?.determination?.length) {
          return {
            ...org,
            type: "organism",
            determination: [{ isPrimary: true }]
          };
        } else if (org?.determination.length === 1) {
          return {
            ...org,
            type: "organism",
            determination: [{ ...org.determination[0], isPrimary: true }]
          };
        }
        return org;
      });

    const collectingEvent = getInitialValuesFromTemplateFields<CollectingEvent>(
      "collecting-event",
      actionDefinition.formTemplates.COLLECTING_EVENT?.templateFields
    );
    const acquisitionEvent =
      getInitialValuesFromTemplateFields<AcquisitionEvent>(
        "acquisition-event",
        actionDefinition.formTemplates.ACQUISITION_EVENT?.templateFields
      );

    if (collectingEvent.id) {
      materialSampleInitialValues.collectingEvent = {
        type: "collecting-event",
        id: collectingEvent.id
      };
    } else {
      set(collectingEvent, "geoReferenceAssertions[0].isPrimary", true);
    }
    if (acquisitionEvent.id) {
      materialSampleInitialValues.acquisitionEvent = {
        type: "acquisition-event",
        id: acquisitionEvent.id
      };
    }

    const collectingEventInitialValues = collectingEvent.id
      ? undefined
      : collectingEvent;
    const acquisitionEventInitialValues = acquisitionEvent.id
      ? undefined
      : acquisitionEvent;

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
      ),
      acquisitionEvent: compact(
        toPairs(
          actionDefinition.formTemplates.ACQUISITION_EVENT?.templateFields
        ).map(([key, val]) => (val?.enabled ? key : null))
      )
    };
    return {
      materialSampleInitialValues,
      collectingEventInitialValues,
      acquisitionEventInitialValues,
      enabledFields
    };
  }, [actionDefinition]);
}

/** Gets the form's initial values from the stored Template. */
function getInitialValuesFromTemplateFields<TResource extends KitsuResource>(
  type: TResource["type"],
  templateFields?: TemplateFields
): InputResource<TResource> {
  const initialValues = { type } as InputResource<TResource>;
  for (const [key, val] of toPairs(templateFields)) {
    if (val?.enabled && !isNil(val.defaultValue)) {
      set(initialValues, key, val.defaultValue);
    }
  }
  return initialValues;
}
