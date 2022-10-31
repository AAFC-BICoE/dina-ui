import {
  BackButton,
  ButtonBar,
  SubmitButton,
  useQuery,
  withResponse
} from "common-ui";
import { pick } from "lodash";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  Head,
  materialSampleFormTemplateSchema,
  MaterialSampleFormTemplateConfig,
  Nav,
  useMaterialSampleFormTemplateProps,
  MaterialSampleForm
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { FormTemplate } from "../../../types/collection-api";

export default function CreateMaterialSampleFromWorkflowPage() {
  const router = useRouter();
  const {
    query: { id: actionDefinitionId }
  } = router;
  const { formatMessage } = useDinaIntl();

  const formTemplateQuery = useQuery<FormTemplate>(
    { path: `collection-api/form-template/${actionDefinitionId}` },
    { disabled: !actionDefinitionId }
  );

  const pageTitle = `${formatMessage("createSampleWithFormTemplate")}${
    formTemplateQuery.response
      ? `: ${formTemplateQuery.response.data.name}`
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
        {withResponse(formTemplateQuery, ({ data }) => {
          const viewConfig = materialSampleFormTemplateSchema.parse(
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
  actionDefinition: MaterialSampleFormTemplateConfig;
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
    visibleManagedAttributeKeys
  } = useMaterialSampleFormTemplateProps(actionDefinition);

  type RoutingButtonStrings = "newRun" | "viewSample";

  /* Route to either new workflow run page with the same template id or
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
            entityLink="/collection/form-template"
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
      attachmentsConfig={{
        collectingEvent: pick(
          actionDefinition.formTemplate.COLLECTING_EVENT,
          "allowNew",
          "allowExisting"
        ),
        materialSample: pick(
          actionDefinition.formTemplate.MATERIAL_SAMPLE,
          "allowNew",
          "allowExisting"
        )
      }}
      visibleManagedAttributeKeys={visibleManagedAttributeKeys}
    />
  );
}
